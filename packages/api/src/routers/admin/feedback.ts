import { z } from "zod";
import { router, adminProcedure } from "../../trpc";

export const adminFeedbackRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.enum(["OPEN", "PROCESSING", "CLOSED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.feedback.findMany({
        where: input.status ? { status: input.status } : {},
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OPEN", "PROCESSING", "CLOSED"]).optional(),
        reply: z.string().max(2000).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.feedback.update({
        where: { id },
        data: {
          ...data,
          ...(data.reply ? { repliedAt: new Date() } : {}),
        },
      });
    }),
});
