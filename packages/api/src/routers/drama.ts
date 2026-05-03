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

    const commentCount = await ctx.prisma.comment.count({
      where: { dramaId: drama.id, status: "VISIBLE" },
    });

    return {
      ...drama,
      playCount: Number(drama.playCount),
      categories: drama.categories.map((c) => c.category),
      tags: drama.tags.map((t) => t.tag),
      liked,
      favorited,
      followed,
      commentCount,
    };
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const drama = await ctx.prisma.drama.findUnique({ where: { slug: input.slug } });
    if (!drama) throw new TRPCError({ code: "NOT_FOUND" });
    return { ...drama, playCount: Number(drama.playCount) };
  }),

  /** Similar dramas — overlap on categories, fall back to similar tags. */
  similar: publicProcedure
    .input(z.object({ id: z.string(), limit: z.number().int().min(1).max(20).default(6) }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.prisma.drama.findUnique({
        where: { id: input.id },
        include: { categories: true, tags: true },
      });
      if (!base) return [];

      const catIds = base.categories.map((c) => c.categoryId);
      const tagIds = base.tags.map((t) => t.tagId);

      const items = await ctx.prisma.drama.findMany({
        where: {
          status: "PUBLISHED",
          id: { not: base.id },
          OR: [
            ...(catIds.length
              ? [{ categories: { some: { categoryId: { in: catIds } } } }]
              : []),
            ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
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
      return items.map((d) => ({ ...d, playCount: Number(d.playCount) }));
    }),

  /** Last-watched episode for the current user, used for "继续观看" */
  myProgress: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return null;
      const wh = await ctx.prisma.watchHistory.findFirst({
        where: { userId: ctx.user.id, dramaId: input.id },
        orderBy: { lastWatchAt: "desc" },
        include: {
          episode: { select: { index: true, title: true } },
        },
      });
      if (!wh) return null;
      return {
        episodeIndex: wh.episode.index,
        episodeTitle: wh.episode.title,
        positionMs: wh.positionMs,
        durationMs: wh.durationMs,
        finished: wh.finished,
      };
    }),
});
