import { z } from "zod";
import { router, adminProcedure } from "../../trpc";
import { AdminUpdateUser } from "@nq/shared/schemas";

export const adminUserRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        q: z.string().optional(),
        role: z.enum(["USER", "EDITOR", "ADMIN", "SUPERADMIN"]).optional(),
        status: z.enum(["ACTIVE", "BANNED", "DELETED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.q
          ? {
              OR: [
                { email: { contains: input.q, mode: "insensitive" as const } },
                { name: { contains: input.q, mode: "insensitive" as const } },
                { displayName: { contains: input.q, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.status ? { status: input.status } : {}),
      };
      const items = await ctx.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),

  update: adminProcedure.input(AdminUpdateUser).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return ctx.prisma.user.update({ where: { id }, data });
  }),
});
