import { z } from "zod";
import { router, adminProcedure } from "../../trpc";
import { ModerateComment } from "@nq/shared/schemas";

export const adminCommentRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.enum(["VISIBLE", "HIDDEN", "PENDING", "DELETED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.comment.findMany({
        where: input.status ? { status: input.status } : {},
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          user: { select: { id: true, displayName: true, email: true } },
          drama: { select: { id: true, title: true } },
          episode: { select: { id: true, index: true, title: true } },
        },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),

  moderate: adminProcedure.input(ModerateComment).mutation(async ({ ctx, input }) => {
    return ctx.prisma.comment.update({
      where: { id: input.id },
      data: { status: input.status },
    });
  }),
});
