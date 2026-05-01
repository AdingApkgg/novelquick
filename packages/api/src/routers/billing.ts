import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { isVipActive } from "@nq/shared/utils";
import { PurchaseCoins, PurchaseVip, UnlockEpisode } from "@nq/shared/schemas";

export const billingRouter = router({
  vipPlans: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.vipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  coinPacks: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.coinPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  /** Stub: in real life this kicks off payment flow; here we simulate paid */
  purchaseVip: protectedProcedure.input(PurchaseVip).mutation(async ({ ctx, input }) => {
    const plan = await ctx.prisma.vipPlan.findUnique({ where: { id: input.vipPlanId } });
    if (!plan || !plan.isActive) throw new TRPCError({ code: "NOT_FOUND" });

    const order = await ctx.prisma.order.create({
      data: {
        userId: ctx.user.id,
        type: "VIP",
        vipPlanId: plan.id,
        amountCents: plan.priceCents,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    const currentVip = (ctx.user as { vipUntil?: Date | string | null }).vipUntil;
    const base = isVipActive(currentVip ? new Date(currentVip) : null)
      ? new Date(currentVip!)
      : new Date();
    const newUntil = new Date(base.getTime() + plan.durationDays * 24 * 3600 * 1000);

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        vipUntil: newUntil,
        coinBalance: { increment: plan.bonusCoins },
      },
    });

    if (plan.bonusCoins > 0) {
      const u = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { coinBalance: true },
      });
      await ctx.prisma.coinTransaction.create({
        data: {
          userId: ctx.user.id,
          delta: plan.bonusCoins,
          balance: u?.coinBalance ?? 0,
          reason: "PURCHASE",
          orderId: order.id,
          note: `VIP 赠送 ${plan.bonusCoins} 金币`,
        },
      });
    }

    return { orderId: order.id, vipUntil: newUntil };
  }),

  purchaseCoins: protectedProcedure.input(PurchaseCoins).mutation(async ({ ctx, input }) => {
    const pack = await ctx.prisma.coinPack.findUnique({ where: { id: input.coinPackId } });
    if (!pack || !pack.isActive) throw new TRPCError({ code: "NOT_FOUND" });
    const total = pack.coins + pack.bonusCoins;

    const order = await ctx.prisma.order.create({
      data: {
        userId: ctx.user.id,
        type: "COIN_PACK",
        coinPackId: pack.id,
        amountCents: pack.priceCents,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    const u = await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { coinBalance: { increment: total } },
      select: { coinBalance: true },
    });

    await ctx.prisma.coinTransaction.create({
      data: {
        userId: ctx.user.id,
        delta: total,
        balance: u.coinBalance,
        reason: "PURCHASE",
        orderId: order.id,
        note: `购买 ${pack.name}`,
      },
    });

    return { orderId: order.id, coinBalance: u.coinBalance };
  }),

  unlockEpisode: protectedProcedure.input(UnlockEpisode).mutation(async ({ ctx, input }) => {
    const ep = await ctx.prisma.episode.findUnique({
      where: { id: input.episodeId },
      include: { drama: true },
    });
    if (!ep) throw new TRPCError({ code: "NOT_FOUND" });

    const existing = await ctx.prisma.episodeUnlock.findUnique({
      where: { userId_episodeId: { userId: ctx.user.id, episodeId: ep.id } },
    });
    if (existing) return { ok: true, alreadyUnlocked: true };

    if (input.source === "VIP") {
      const userVipUntil = (ctx.user as { vipUntil?: Date | string | null }).vipUntil;
      if (!isVipActive(userVipUntil ? new Date(userVipUntil) : null)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "VIP not active" });
      }
      await ctx.prisma.episodeUnlock.create({
        data: { userId: ctx.user.id, episodeId: ep.id, source: "VIP" },
      });
      return { ok: true, source: "VIP" };
    }

    if (input.source === "AD") {
      await ctx.prisma.episodeUnlock.create({
        data: { userId: ctx.user.id, episodeId: ep.id, source: "AD" },
      });
      return { ok: true, source: "AD" };
    }

    // COINS path
    const cost = ep.unlockCoins > 0 ? ep.unlockCoins : ep.drama.unlockCoins;
    const u = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { coinBalance: true },
    });
    if (!u || u.coinBalance < cost) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "余额不足" });
    }

    return ctx.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: ctx.user.id },
        data: { coinBalance: { decrement: cost } },
        select: { coinBalance: true },
      });
      await tx.episodeUnlock.create({
        data: { userId: ctx.user.id, episodeId: ep.id, source: "COINS", coins: cost },
      });
      await tx.coinTransaction.create({
        data: {
          userId: ctx.user.id,
          delta: -cost,
          balance: updated.coinBalance,
          reason: "UNLOCK",
          episodeId: ep.id,
          note: `解锁 ${ep.title}`,
        },
      });
      return { ok: true, source: "COINS", coinBalance: updated.coinBalance };
    });
  }),

  myOrders: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.order.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: { vipPlan: true, coinPack: true },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),
});
