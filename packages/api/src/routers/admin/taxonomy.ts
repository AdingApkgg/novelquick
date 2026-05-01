import { z } from "zod";
import { router, adminProcedure } from "../../trpc";
import { Slug } from "@nq/shared/schemas";

const Cat = z.object({
  id: z.string().optional(),
  slug: Slug,
  name: z.string().min(1).max(40),
  cover: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

const Tg = z.object({ id: z.string().optional(), slug: Slug, name: z.string().min(1).max(40) });

export const adminTaxonomyRouter = router({
  listCategories: adminProcedure.query(({ ctx }) =>
    ctx.prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ),
  upsertCategory: adminProcedure.input(Cat).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) return ctx.prisma.category.update({ where: { id }, data });
    return ctx.prisma.category.create({ data });
  }),
  deleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.category.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  listTags: adminProcedure.query(({ ctx }) => ctx.prisma.tag.findMany({ orderBy: { name: "asc" } })),
  upsertTag: adminProcedure.input(Tg).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) return ctx.prisma.tag.update({ where: { id }, data });
    return ctx.prisma.tag.create({ data });
  }),
  deleteTag: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.tag.delete({ where: { id: input.id } });
    return { ok: true };
  }),
});
