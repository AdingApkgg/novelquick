import { z } from "zod";
import { router, adminProcedure } from "../../trpc";
import { UpsertFeedSlot, UpsertFeedSlotItem, RebuildLeaderboard } from "@nq/shared/schemas";

export const adminFeedRouter = router({
  listSlots: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.feedSlot.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" }, include: { drama: true } } },
    });
  }),

  upsertSlot: adminProcedure.input(UpsertFeedSlot).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) {
      return ctx.prisma.feedSlot.update({ where: { id }, data });
    }
    return ctx.prisma.feedSlot.create({ data });
  }),

  upsertItem: adminProcedure.input(UpsertFeedSlotItem).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) {
      return ctx.prisma.feedSlotItem.update({ where: { id }, data });
    }
    return ctx.prisma.feedSlotItem.create({ data });
  }),

  removeItem: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.feedSlotItem.delete({ where: { id: input.id } });
    return { ok: true };
  }),

  rebuildLeaderboard: adminProcedure.input(RebuildLeaderboard).mutation(async ({ ctx, input }) => {
    const lb = await ctx.prisma.leaderboard.findUnique({ where: { key: input.key } });
    if (!lb) return { ok: false, reason: "missing leaderboard" };

    let dramas: { id: string; score: number }[] = [];
    if (input.key === "hot") {
      const list = await ctx.prisma.drama.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { playCount: "desc" },
        take: input.limit,
        select: { id: true, playCount: true },
      });
      dramas = list.map((d) => ({ id: d.id, score: Number(d.playCount) }));
    } else if (input.key === "new") {
      const list = await ctx.prisma.drama.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: input.limit,
        select: { id: true, publishedAt: true },
      });
      dramas = list.map((d, i) => ({ id: d.id, score: list.length - i }));
    } else if (input.key === "follow") {
      const list = await ctx.prisma.drama.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { favoriteCount: "desc" },
        take: input.limit,
        select: { id: true, favoriteCount: true },
      });
      dramas = list.map((d) => ({ id: d.id, score: d.favoriteCount }));
    } else if (input.key === "vip") {
      const list = await ctx.prisma.drama.findMany({
        where: { status: "PUBLISHED", isVip: true },
        orderBy: { playCount: "desc" },
        take: input.limit,
        select: { id: true, playCount: true },
      });
      dramas = list.map((d) => ({ id: d.id, score: Number(d.playCount) }));
    }

    await ctx.prisma.$transaction([
      ctx.prisma.leaderboardItem.deleteMany({ where: { leaderboardId: lb.id } }),
      ...dramas.map((d, i) =>
        ctx.prisma.leaderboardItem.create({
          data: { leaderboardId: lb.id, dramaId: d.id, rank: i + 1, score: d.score },
        }),
      ),
      ctx.prisma.leaderboard.update({
        where: { id: lb.id },
        data: { refreshedAt: new Date() },
      }),
    ]);
    return { ok: true, count: dramas.length };
  }),
});
