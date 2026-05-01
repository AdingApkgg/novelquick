import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const historyRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.watchHistory.findMany({
        where: { userId: ctx.user.id },
        orderBy: { lastWatchAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          drama: { select: { id: true, title: true, cover: true, totalEpisodes: true } },
          episode: { select: { id: true, index: true, title: true } },
        },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),

  follows: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.followDrama.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          drama: {
            select: {
              id: true,
              title: true,
              cover: true,
              totalEpisodes: true,
              releaseStatus: true,
            },
          },
        },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),

  favorites: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.favorite.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          drama: {
            select: { id: true, title: true, cover: true, totalEpisodes: true, isVip: true },
          },
        },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),

  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.watchHistory.deleteMany({ where: { userId: ctx.user.id } });
    return { ok: true };
  }),
});
