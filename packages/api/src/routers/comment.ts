import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, rateLimited } from "../trpc";
import { CreateComment, ListComments } from "@nq/shared/schemas";

const ListCommentsExt = ListComments.extend({
  sort: z.enum(["hot", "new"]).default("hot"),
});

export const commentRouter = router({
  list: publicProcedure.input(ListCommentsExt).query(async ({ ctx, input }) => {
    const where = {
      status: "VISIBLE" as const,
      ...(input.dramaId ? { dramaId: input.dramaId } : {}),
      ...(input.episodeId ? { episodeId: input.episodeId } : {}),
      ...(input.parentId ? { parentId: input.parentId } : { parentId: null }),
    };

    const orderBy =
      input.sort === "hot"
        ? [{ likeCount: "desc" as const }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }];

    const items = await ctx.prisma.comment.findMany({
      where,
      orderBy,
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, displayName: true, name: true, image: true } },
      },
    });
    const sliced = items.slice(0, input.limit);
    const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;

    let likedSet = new Set<string>();
    if (ctx.user && sliced.length > 0) {
      const ids = sliced.map((c) => c.id);
      const likes = await ctx.prisma.like.findMany({
        where: { userId: ctx.user.id, commentId: { in: ids } },
        select: { commentId: true },
      });
      likedSet = new Set(likes.map((l) => l.commentId!).filter(Boolean));
    }

    return {
      items: sliced.map((c) => ({ ...c, liked: likedSet.has(c.id) })),
      nextCursor,
    };
  }),

  /** Children replies of a single comment */
  replies: publicProcedure
    .input(
      z.object({
        parentId: z.string(),
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.comment.findMany({
        where: { parentId: input.parentId, status: "VISIBLE" },
        orderBy: { createdAt: "asc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          user: { select: { id: true, displayName: true, name: true, image: true } },
        },
      });
      const sliced = items.slice(0, input.limit);
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;

      let likedSet = new Set<string>();
      if (ctx.user && sliced.length > 0) {
        const ids = sliced.map((c) => c.id);
        const likes = await ctx.prisma.like.findMany({
          where: { userId: ctx.user.id, commentId: { in: ids } },
          select: { commentId: true },
        });
        likedSet = new Set(likes.map((l) => l.commentId!).filter(Boolean));
      }

      return {
        items: sliced.map((c) => ({ ...c, liked: likedSet.has(c.id) })),
        nextCursor,
      };
    }),

  create: rateLimited(protectedProcedure, { name: "comment", limit: 10, windowSec: 60 })
    .input(CreateComment)
    .mutation(async ({ ctx, input }) => {
      const parent = input.parentId
        ? await ctx.prisma.comment.findUnique({ where: { id: input.parentId } })
        : null;
      if (input.parentId && !parent) throw new TRPCError({ code: "NOT_FOUND" });

      const comment = await ctx.prisma.comment.create({
        data: {
          userId: ctx.user.id,
          dramaId: input.dramaId ?? parent?.dramaId,
          episodeId: input.episodeId ?? parent?.episodeId,
          parentId: input.parentId,
          rootId: parent ? (parent.rootId ?? parent.id) : null,
          content: input.content,
        },
        include: { user: { select: { id: true, displayName: true, name: true, image: true } } },
      });

      if (input.parentId) {
        await ctx.prisma.comment.update({
          where: { id: input.parentId },
          data: { replyCount: { increment: 1 } },
        });
      }

      return { ...comment, liked: false };
    }),

  toggleLike: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.like.findUnique({
        where: { userId_commentId: { userId: ctx.user.id, commentId: input.commentId } },
      });
      if (existing) {
        await ctx.prisma.$transaction([
          ctx.prisma.like.delete({ where: { id: existing.id } }),
          ctx.prisma.comment.update({
            where: { id: input.commentId },
            data: { likeCount: { decrement: 1 } },
          }),
        ]);
        return { liked: false };
      }
      await ctx.prisma.$transaction([
        ctx.prisma.like.create({
          data: { userId: ctx.user.id, commentId: input.commentId },
        }),
        ctx.prisma.comment.update({
          where: { id: input.commentId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      return { liked: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.prisma.comment.findUnique({ where: { id: input.id } });
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      const role = (ctx.user as { role?: string }).role;
      const allowed = c.userId === ctx.user.id || role === "ADMIN" || role === "SUPERADMIN";
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.prisma.comment.update({ where: { id: input.id }, data: { status: "DELETED" } });
      return { ok: true };
    }),
});
