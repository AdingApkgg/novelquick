import { router, publicProcedure, protectedProcedure, rateLimited } from "../trpc";
import { SendDanmaku, ListDanmaku } from "@nq/shared/schemas";

export const danmakuRouter = router({
  list: publicProcedure.input(ListDanmaku).query(async ({ ctx, input }) => {
    const items = await ctx.prisma.danmaku.findMany({
      where: {
        episodeId: input.episodeId,
        status: "VISIBLE",
        timeMs: { gte: input.fromMs, ...(input.toMs ? { lte: input.toMs } : {}) },
      },
      orderBy: { timeMs: "asc" },
      take: input.limit,
      select: {
        id: true,
        episodeId: true,
        userId: true,
        timeMs: true,
        text: true,
        color: true,
        fontSize: true,
        mode: true,
      },
    });
    return items;
  }),

  send: rateLimited(protectedProcedure, { name: "danmaku", limit: 20, windowSec: 60 })
    .input(SendDanmaku)
    .mutation(async ({ ctx, input }) => {
      const dm = await ctx.prisma.danmaku.create({
        data: {
          episodeId: input.episodeId,
          userId: ctx.user.id,
          timeMs: input.timeMs,
          text: input.text,
          color: input.color,
          fontSize: input.fontSize,
          mode: input.mode,
        },
      });
      return dm;
    }),
});
