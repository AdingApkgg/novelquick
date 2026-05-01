import { router, adminProcedure } from "../../trpc";

export const adminStatsRouter = router({
  overview: adminProcedure.query(async ({ ctx }) => {
    const [users, dramas, episodes, comments, orders, paidOrders] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.drama.count(),
      ctx.prisma.episode.count(),
      ctx.prisma.comment.count({ where: { status: "VISIBLE" } }),
      ctx.prisma.order.count(),
      ctx.prisma.order.aggregate({
        _sum: { amountCents: true },
        where: { status: "PAID" },
      }),
    ]);
    return {
      users,
      dramas,
      episodes,
      comments,
      orders,
      revenueCents: paidOrders._sum.amountCents ?? 0,
    };
  }),

  recent: adminProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [newUsers, newOrders] = await Promise.all([
      ctx.prisma.user.count({ where: { createdAt: { gte: since } } }),
      ctx.prisma.order.count({ where: { createdAt: { gte: since }, status: "PAID" } }),
    ]);
    return { newUsers, newOrders };
  }),
});
