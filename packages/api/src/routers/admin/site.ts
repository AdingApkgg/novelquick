import { z } from "zod";
import { router, adminProcedure } from "../../trpc";

export const adminSiteRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  }),

  set: adminProcedure
    .input(z.object({ key: z.string().min(1).max(64), value: z.any() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.siteSetting.upsert({
        where: { key: input.key },
        update: { value: input.value },
        create: { key: input.key, value: input.value },
      });
    }),

  delete: adminProcedure.input(z.object({ key: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.siteSetting.delete({ where: { key: input.key } }).catch(() => {});
    return { ok: true };
  }),
});
