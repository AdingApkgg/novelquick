import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../../trpc";
import { CreateDrama, UpdateDrama, ListDrama } from "@nq/shared/schemas";

export const adminDramaRouter = router({
  list: adminProcedure
    .input(ListDrama.partial().extend({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.status ? { status: input.status } : {}),
        ...(input.q ? { title: { contains: input.q, mode: "insensitive" as const } } : {}),
      };
      const items = await ctx.prisma.drama.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: { _count: { select: { episodes: true } } },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return {
        items: items.slice(0, input.limit).map((d) => ({ ...d, playCount: Number(d.playCount) })),
        nextCursor,
      };
    }),

  byId: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const d = await ctx.prisma.drama.findUnique({
      where: { id: input.id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        episodes: { orderBy: { index: "asc" } },
      },
    });
    if (!d) throw new TRPCError({ code: "NOT_FOUND" });
    return { ...d, playCount: Number(d.playCount) };
  }),

  create: adminProcedure.input(CreateDrama).mutation(async ({ ctx, input }) => {
    const { categoryIds, tagIds, ...rest } = input;
    const d = await ctx.prisma.drama.create({
      data: {
        ...rest,
        publishedAt: rest.status === "PUBLISHED" ? new Date() : null,
        categories: { create: categoryIds.map((id) => ({ categoryId: id })) },
        tags: { create: tagIds.map((id) => ({ tagId: id })) },
      },
    });
    await audit(ctx, "drama.create", "drama", d.id, null, d);
    return d;
  }),

  update: adminProcedure.input(UpdateDrama).mutation(async ({ ctx, input }) => {
    const { id, categoryIds, tagIds, ...rest } = input;
    const before = await ctx.prisma.drama.findUnique({ where: { id } });
    if (!before) throw new TRPCError({ code: "NOT_FOUND" });

    const d = await ctx.prisma.drama.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.status === "PUBLISHED" && !before.publishedAt ? { publishedAt: new Date() } : {}),
        ...(categoryIds
          ? {
              categories: {
                deleteMany: {},
                create: categoryIds.map((cid) => ({ categoryId: cid })),
              },
            }
          : {}),
        ...(tagIds
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tid) => ({ tagId: tid })),
              },
            }
          : {}),
      },
    });
    await audit(ctx, "drama.update", "drama", d.id, before, d);
    return d;
  }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.drama.delete({ where: { id: input.id } });
    await audit(ctx, "drama.delete", "drama", input.id, null, null);
    return { ok: true };
  }),
});

async function audit(
  ctx: { prisma: import("@nq/db").PrismaClient; user: { id: string } },
  action: string,
  resource: string,
  resourceId: string,
  before: unknown,
  after: unknown,
) {
  await ctx.prisma.auditLog.create({
    data: {
      actorId: ctx.user.id,
      action,
      resource,
      resourceId,
      before: before === null ? undefined : (before as object),
      after: after === null ? undefined : (after as object),
    },
  });
}
