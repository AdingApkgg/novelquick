import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { ListDrama } from "@nq/shared/schemas";

export const dramaRouter = router({
  list: publicProcedure.input(ListDrama).query(async ({ ctx, input }) => {
    const where = {
      status: input.status ?? "PUBLISHED",
      ...(input.q ? { title: { contains: input.q, mode: "insensitive" as const } } : {}),
      ...(input.categorySlug && input.categorySlug !== "all"
        ? { categories: { some: { category: { slug: input.categorySlug } } } }
        : {}),
      ...(input.tagSlug ? { tags: { some: { tag: { slug: input.tagSlug } } } } : {}),
    };

    const orderBy =
      input.sort === "new"
        ? [{ publishedAt: "desc" as const }]
        : input.sort === "hot"
          ? [{ playCount: "desc" as const }]
          : input.sort === "rating"
            ? [{ rating: "desc" as const }]
            : [{ sortWeight: "desc" as const }, { publishedAt: "desc" as const }];

    const dramas = await ctx.prisma.drama.findMany({
      where,
      orderBy,
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });

    const nextCursor = dramas.length > input.limit ? dramas[input.limit]!.id : null;
    return {
      items: dramas.slice(0, input.limit).map((d) => ({
        ...d,
        playCount: Number(d.playCount),
      })),
      nextCursor,
    };
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const drama = await ctx.prisma.drama.findUnique({
      where: { id: input.id },
      include: {
        episodes: {
          where: { status: { in: ["READY", "TRANSCODING"] } },
          orderBy: { index: "asc" },
          select: { id: true, index: true, title: true, isFree: true, duration: true, status: true },
        },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    if (!drama) throw new TRPCError({ code: "NOT_FOUND" });

    let liked = false;
    let favorited = false;
    let followed = false;
    if (ctx.user) {
      const [l, f, fo] = await Promise.all([
        ctx.prisma.like.findUnique({
          where: { userId_dramaId: { userId: ctx.user.id, dramaId: drama.id } },
        }),
        ctx.prisma.favorite.findUnique({
          where: { userId_dramaId: { userId: ctx.user.id, dramaId: drama.id } },
        }),
        ctx.prisma.followDrama.findUnique({
          where: { userId_dramaId: { userId: ctx.user.id, dramaId: drama.id } },
        }),
      ]);
      liked = !!l;
      favorited = !!f;
      followed = !!fo;
    }

    return {
      ...drama,
      playCount: Number(drama.playCount),
      categories: drama.categories.map((c) => c.category),
      tags: drama.tags.map((t) => t.tag),
      liked,
      favorited,
      followed,
    };
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const drama = await ctx.prisma.drama.findUnique({ where: { slug: input.slug } });
    if (!drama) throw new TRPCError({ code: "NOT_FOUND" });
    return { ...drama, playCount: Number(drama.playCount) };
  }),
});
