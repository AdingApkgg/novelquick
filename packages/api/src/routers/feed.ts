import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import type { FeedItem } from "@nq/shared/types";
import { FEED_KEYS, LEADERBOARD_KEYS } from "@nq/shared/constants";

export const feedRouter = router({
  /** Vertical immersive feed — like Douyin's "推荐" tab */
  recommend: publicProcedure
    .input(
      z.object({
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit;
      const dramas = await ctx.prisma.drama.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ sortWeight: "desc" }, { publishedAt: "desc" }],
        take: limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          episodes: {
            where: { status: "READY" },
            orderBy: { index: "asc" },
            take: 1,
          },
        },
      });

      const nextCursor = dramas.length > limit ? dramas[limit]!.id : null;
      const slice = dramas.slice(0, limit);
      const items: FeedItem[] = slice.map((d) => ({
        id: d.id,
        drama: {
          id: d.id,
          title: d.title,
          cover: d.cover,
          poster: d.poster ?? d.cover,
          description: d.description,
          isVip: d.isVip,
          rating: d.rating,
          playCount: Number(d.playCount),
          totalEpisodes: d.totalEpisodes,
        },
        trailerUrl: d.trailerUrl,
        firstEpisodeId: d.episodes[0]?.id ?? null,
      }));

      return { items, nextCursor };
    }),

  /** Banners + curated sections for the home page (red book / Hongguo style) */
  home: publicProcedure.query(async ({ ctx }) => {
    const slots = await ctx.prisma.feedSlot.findMany({
      where: {
        isActive: true,
        key: {
          in: [FEED_KEYS.HOME_BANNER, FEED_KEYS.HOME_HOT, FEED_KEYS.HOME_NEW, FEED_KEYS.HOME_RECOMMEND],
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            drama: {
              select: {
                id: true,
                title: true,
                cover: true,
                poster: true,
                isVip: true,
                totalEpisodes: true,
                rating: true,
                playCount: true,
              },
            },
          },
        },
      },
    });

    return slots.map((s) => ({
      key: s.key,
      name: s.name,
      position: s.position,
      items: s.items.map((it) => ({
        id: it.id,
        title: it.title ?? it.drama?.title ?? "",
        bannerImg: it.bannerImg,
        bannerUrl: it.bannerUrl,
        drama: it.drama
          ? {
              ...it.drama,
              playCount: Number(it.drama.playCount),
            }
          : null,
      })),
    }));
  }),

  /** Categories / Tags */
  categories: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  tags: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.tag.findMany({ orderBy: { name: "asc" } });
  }),

  /** Leaderboards */
  leaderboard: publicProcedure
    .input(
      z.object({
        key: z
          .enum([LEADERBOARD_KEYS.HOT, LEADERBOARD_KEYS.NEW, LEADERBOARD_KEYS.FOLLOW, LEADERBOARD_KEYS.VIP])
          .default(LEADERBOARD_KEYS.HOT),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const lb = await ctx.prisma.leaderboard.findUnique({ where: { key: input.key } });
      if (!lb) return [];
      const items = await ctx.prisma.leaderboardItem.findMany({
        where: { leaderboardId: lb.id },
        orderBy: { rank: "asc" },
        take: input.limit,
        include: {
          drama: {
            select: {
              id: true,
              title: true,
              cover: true,
              poster: true,
              isVip: true,
              totalEpisodes: true,
              rating: true,
              playCount: true,
            },
          },
        },
      });
      return items.map((it) => ({
        rank: it.rank,
        score: it.score,
        drama: { ...it.drama, playCount: Number(it.drama.playCount) },
      }));
    }),
});
