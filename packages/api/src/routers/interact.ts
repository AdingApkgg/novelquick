import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const interactRouter = router({
  toggleLike: protectedProcedure
    .input(z.object({ dramaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.like.findUnique({
        where: { userId_dramaId: { userId: ctx.user.id, dramaId: input.dramaId } },
      });
      if (existing) {
        await ctx.prisma.like.delete({ where: { id: existing.id } });
        await ctx.prisma.drama.update({
          where: { id: input.dramaId },
          data: { likeCount: { decrement: 1 } },
        });
        return { liked: false };
      }
      await ctx.prisma.like.create({ data: { userId: ctx.user.id, dramaId: input.dramaId } });
      await ctx.prisma.drama.update({
        where: { id: input.dramaId },
        data: { likeCount: { increment: 1 } },
      });
      return { liked: true };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ dramaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.favorite.findUnique({
        where: { userId_dramaId: { userId: ctx.user.id, dramaId: input.dramaId } },
      });
      if (existing) {
        await ctx.prisma.favorite.delete({ where: { id: existing.id } });
        await ctx.prisma.drama.update({
          where: { id: input.dramaId },
          data: { favoriteCount: { decrement: 1 } },
        });
        return { favorited: false };
      }
      await ctx.prisma.favorite.create({ data: { userId: ctx.user.id, dramaId: input.dramaId } });
      await ctx.prisma.drama.update({
        where: { id: input.dramaId },
        data: { favoriteCount: { increment: 1 } },
      });
      return { favorited: true };
    }),

  toggleFollow: protectedProcedure
    .input(z.object({ dramaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.followDrama.findUnique({
        where: { userId_dramaId: { userId: ctx.user.id, dramaId: input.dramaId } },
      });
      if (existing) {
        await ctx.prisma.followDrama.delete({ where: { id: existing.id } });
        return { followed: false };
      }
      await ctx.prisma.followDrama.create({
        data: { userId: ctx.user.id, dramaId: input.dramaId },
      });
      return { followed: true };
    }),
});
