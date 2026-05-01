import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { CreateComment, ListComments } from "@nq/shared/schemas";

export const commentRouter = router({
  list: publicProcedure.input(ListComments).query(async ({ ctx, input }) => {
    const where = {
      status: "VISIBLE" as const,
      ...(input.dramaId ? { dramaId: input.dramaId } : {}),
      ...(input.episodeId ? { episodeId: input.episodeId } : {}),
      ...(input.parentId ? { parentId: input.parentId } : { parentId: null }),
    };
    const items = await ctx.prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, displayName: true, name: true, image: true } },
      },
    });
    const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
    return { items: items.slice(0, input.limit), nextCursor };
  }),

  create: protectedProcedure.input(CreateComment).mutation(async ({ ctx, input }) => {
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

    return comment;
  }),

  delete: protectedProcedure
    .input((v) => v as { id: string })
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
