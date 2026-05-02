import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { UpdateProfile } from "@nq/shared/schemas";
import { COIN_DEFAULTS } from "@nq/shared/constants";

function startOfUtcDay(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return x;
}
function dayDiff(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

export const meRouter = router({
  whoami: publicProcedure.query(({ ctx }) => {
    return ctx.user
      ? {
          id: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name,
          displayName: (ctx.user as { displayName?: string }).displayName ?? ctx.user.name,
          image: ctx.user.image,
          role: (ctx.user as { role?: string }).role ?? "USER",
          coinBalance: (ctx.user as { coinBalance?: number }).coinBalance ?? 0,
          vipUntil: (ctx.user as { vipUntil?: Date | null }).vipUntil ?? null,
        }
      : null;
  }),

  updateProfile: protectedProcedure.input(UpdateProfile).mutation(async ({ ctx, input }) => {
    const u = await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: input,
    });
    return u;
  }),

  coinTransactions: protectedProcedure.query(async ({ ctx }) => {
    const txs = await ctx.prisma.coinTransaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return txs;
  }),

  /** Returns today's check-in state and the last 7 days for the streak indicator. */
  checkInStatus: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfUtcDay();
    const sevenAgo = new Date(today.getTime() - 6 * 86_400_000);
    const recent = await ctx.prisma.checkIn.findMany({
      where: { userId: ctx.user.id, date: { gte: sevenAgo } },
      orderBy: { date: "desc" },
    });

    const todayRecord = recent.find((r) => +r.date === +today) ?? null;
    const last = recent[0];
    let streak = 0;
    if (last) {
      const expected = new Date(today);
      // walk back day by day matching dates
      for (const c of recent) {
        if (+c.date === +expected) {
          streak++;
          expected.setUTCDate(expected.getUTCDate() - 1);
        } else if (+c.date < +expected) {
          break;
        }
      }
    }

    return {
      checkedToday: !!todayRecord,
      streak,
      todayReward: COIN_DEFAULTS.CHECK_IN,
      next7: Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today.getTime() - (6 - i) * 86_400_000);
        const found = recent.find((r) => +r.date === +d);
        return {
          dateISO: d.toISOString().slice(0, 10),
          checked: !!found,
          coins: found?.coinsAwarded ?? 0,
        };
      }),
    };
  }),

  /** Claim today's check-in coins. Idempotent. */
  checkIn: protectedProcedure.mutation(async ({ ctx }) => {
    const today = startOfUtcDay();
    const yesterday = new Date(today.getTime() - 86_400_000);

    const existing = await ctx.prisma.checkIn.findUnique({
      where: { userId_date: { userId: ctx.user.id, date: today } },
    });
    if (existing) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "今天已签到" });
    }

    const yesterdayRow = await ctx.prisma.checkIn.findUnique({
      where: { userId_date: { userId: ctx.user.id, date: yesterday } },
    });
    const streak = yesterdayRow ? yesterdayRow.streak + 1 : 1;
    // Reward grows with streak: base + min(streak-1, 6) * 1 coin
    const coins = COIN_DEFAULTS.CHECK_IN + Math.min(streak - 1, 6);

    return ctx.prisma.$transaction(async (tx) => {
      const checkin = await tx.checkIn.create({
        data: { userId: ctx.user.id, date: today, coinsAwarded: coins, streak },
      });
      const u = await tx.user.update({
        where: { id: ctx.user.id },
        data: { coinBalance: { increment: coins } },
        select: { coinBalance: true },
      });
      await tx.coinTransaction.create({
        data: {
          userId: ctx.user.id,
          delta: coins,
          balance: u.coinBalance,
          reason: "CHECK_IN",
          note: `每日签到 (连续${streak}天)`,
        },
      });
      return { ok: true, coins, streak, balance: u.coinBalance, checkin };
    });
  }),
});
