import { z } from "zod";
import { router, adminProcedure } from "../../trpc";

const VipPlanInput = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  durationDays: z.number().int().min(1),
  priceCents: z.number().int().min(0),
  bonusCoins: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const CoinPackInput = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  coins: z.number().int().min(1),
  bonusCoins: z.number().int().min(0).default(0),
  priceCents: z.number().int().min(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const adminMonetizationRouter = router({
  listVipPlans: adminProcedure.query(({ ctx }) =>
    ctx.prisma.vipPlan.findMany({ orderBy: { sortOrder: "asc" } }),
  ),
  upsertVipPlan: adminProcedure.input(VipPlanInput).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) return ctx.prisma.vipPlan.update({ where: { id }, data });
    return ctx.prisma.vipPlan.create({ data });
  }),

  listCoinPacks: adminProcedure.query(({ ctx }) =>
    ctx.prisma.coinPack.findMany({ orderBy: { sortOrder: "asc" } }),
  ),
  upsertCoinPack: adminProcedure.input(CoinPackInput).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) return ctx.prisma.coinPack.update({ where: { id }, data });
    return ctx.prisma.coinPack.create({ data });
  }),

  listOrders: adminProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.enum(["PENDING", "PAID", "CANCELED", "REFUNDED", "FAILED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.order.findMany({
        where: input.status ? { status: input.status } : {},
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          user: { select: { email: true, displayName: true } },
          vipPlan: { select: { name: true } },
          coinPack: { select: { name: true } },
        },
      });
      const nextCursor = items.length > input.limit ? items[input.limit]!.id : null;
      return { items: items.slice(0, input.limit), nextCursor };
    }),
});
