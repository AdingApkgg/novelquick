import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const searchRouter = router({
  query: publicProcedure
    .input(z.object({ q: z.string().min(1).max(60), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const dramas = await ctx.prisma.drama.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: input.q, mode: "insensitive" } },
            { subtitle: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
          ],
        },
        orderBy: [{ playCount: "desc" }],
        take: input.limit,
        select: {
          id: true,
          title: true,
          cover: true,
          totalEpisodes: true,
          isVip: true,
          rating: true,
          playCount: true,
        },
      });
      return dramas.map((d) => ({ ...d, playCount: Number(d.playCount) }));
    }),

  trending: publicProcedure.query(async ({ ctx }) => {
    const dramas = await ctx.prisma.drama.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ playCount: "desc" }],
      take: 10,
      select: { id: true, title: true },
    });
    return dramas;
  }),
});
