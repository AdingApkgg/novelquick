import { z } from "zod";
import { router, adminProcedure } from "../../trpc";

export const adminAuditRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        actorId: z.string().optional(),
        resource: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.auditLog.findMany({
        where: {
          ...(input.actorId ? { actorId: input.actorId } : {}),
          ...(input.resource ? { resource: input.resource } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          actor: { select: { id: true, displayName: true, email: true } },
        },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),
});
