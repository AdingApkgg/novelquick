import { router, protectedProcedure, publicProcedure } from "../trpc";
import { UpdateProfile } from "@nq/shared/schemas";

export const meRouter = router({
  whoami: publicProcedure.query(({ ctx }) => {
    return ctx.user
      ? {
          id: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name,
          displayName: (ctx.user as { displayName?: string }).displayName ?? ctx.user.name,
          image: ctx.user.image,
          role: (ctx.user as { role?: string }).role ?? "USER",
          coinBalance: (ctx.user as { coinBalance?: number }).coinBalance ?? 0,
          vipUntil: (ctx.user as { vipUntil?: Date | null }).vipUntil ?? null,
        }
      : null;
  }),

  updateProfile: protectedProcedure.input(UpdateProfile).mutation(async ({ ctx, input }) => {
    const u = await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: input,
    });
    return u;
  }),

  coinTransactions: protectedProcedure.query(async ({ ctx }) => {
    const txs = await ctx.prisma.coinTransaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return txs;
  }),
});
