import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import type { WatchPayload } from "@nq/shared/types";
import { isVipActive } from "@nq/shared/utils";
import { ReportProgress } from "@nq/shared/schemas";

export const episodeRouter = router({
  /** Get the watch payload for an episode (or default to first if index omitted) */
  watch: publicProcedure
    .input(z.object({ dramaId: z.string(), index: z.number().int().min(1).optional() }))
    .query(async ({ ctx, input }): Promise<WatchPayload> => {
      const drama = await ctx.prisma.drama.findUnique({
        where: { id: input.dramaId },
        include: {
          episodes: {
            where: { status: { in: ["READY", "TRANSCODING"] } },
            orderBy: { index: "asc" },
            select: { id: true, index: true, title: true, isFree: true, duration: true, status: true },
          },
        },
      });
      if (!drama) throw new TRPCError({ code: "NOT_FOUND" });

      const targetIndex = input.index ?? drama.episodes[0]?.index ?? 1;
      const ep = await ctx.prisma.episode.findUnique({
        where: { dramaId_index: { dramaId: drama.id, index: targetIndex } },
        include: {
          videoAssets: { where: { kind: "HLS_MASTER" }, take: 1 },
        },
      });
      if (!ep) throw new TRPCError({ code: "NOT_FOUND" });

      const userId = ctx.user?.id;
      const userVipUntil = (ctx.user as { vipUntil?: Date | string | null } | null)?.vipUntil;
      const vipActive = isVipActive(userVipUntil ? new Date(userVipUntil) : null);

      // unlock check
      let locked = false;
      if (!ep.isFree && ep.index > drama.freeEpisodes) {
        if (vipActive) locked = false;
        else if (userId) {
          const unlock = await ctx.prisma.episodeUnlock.findUnique({
            where: { userId_episodeId: { userId, episodeId: ep.id } },
          });
          locked = !unlock;
        } else {
          locked = true;
        }
      }

      // resume position
      let positionMs = 0;
      if (userId) {
        const wh = await ctx.prisma.watchHistory.findUnique({
          where: { userId_episodeId: { userId, episodeId: ep.id } },
        });
        positionMs = wh?.positionMs ?? 0;
      }

      const liked = userId
        ? !!(await ctx.prisma.like.findUnique({
            where: { userId_dramaId: { userId, dramaId: drama.id } },
          }))
        : false;
      const favorited = userId
        ? !!(await ctx.prisma.favorite.findUnique({
            where: { userId_dramaId: { userId, dramaId: drama.id } },
          }))
        : false;
      const followed = userId
        ? !!(await ctx.prisma.followDrama.findUnique({
            where: { userId_dramaId: { userId, dramaId: drama.id } },
          }))
        : false;

      // unlock map for episode list
      const unlockedIds = userId
        ? new Set(
            (
              await ctx.prisma.episodeUnlock.findMany({
                where: { userId, episode: { dramaId: drama.id } },
                select: { episodeId: true },
              })
            ).map((u) => u.episodeId),
          )
        : new Set<string>();

      return {
        drama: {
          id: drama.id,
          title: drama.title,
          description: drama.description,
          cover: drama.cover,
          isVip: drama.isVip,
          freeEpisodes: drama.freeEpisodes,
          unlockCoins: drama.unlockCoins,
          totalEpisodes: drama.totalEpisodes,
          likeCount: drama.likeCount,
          favoriteCount: drama.favoriteCount,
          liked,
          favorited,
          followed,
        },
        episode: {
          id: ep.id,
          index: ep.index,
          title: ep.title,
          duration: ep.duration,
          isFree: ep.isFree,
          locked,
          hlsUrl: locked ? null : (ep.videoAssets[0]?.url ?? null),
          posterUrl: ep.coverUrl,
        },
        positionMs,
        episodes: drama.episodes.map((e) => ({
          id: e.id,
          index: e.index,
          title: e.title,
          isFree: e.isFree,
          locked:
            !e.isFree &&
            e.index > drama.freeEpisodes &&
            !vipActive &&
            !unlockedIds.has(e.id),
        })),
      };
    }),

  /** Report watch progress (called every PROGRESS_REPORT_MS) */
  reportProgress: protectedProcedure.input(ReportProgress).mutation(async ({ ctx, input }) => {
    const ep = await ctx.prisma.episode.findUnique({
      where: { id: input.episodeId },
      select: { dramaId: true, duration: true },
    });
    if (!ep) throw new TRPCError({ code: "NOT_FOUND" });

    const finished = input.durationMs > 0 && input.positionMs / input.durationMs >= 0.95;

    await ctx.prisma.watchHistory.upsert({
      where: { userId_episodeId: { userId: ctx.user.id, episodeId: input.episodeId } },
      update: {
        positionMs: input.positionMs,
        durationMs: input.durationMs,
        finished,
        lastWatchAt: new Date(),
      },
      create: {
        userId: ctx.user.id,
        dramaId: ep.dramaId,
        episodeId: input.episodeId,
        positionMs: input.positionMs,
        durationMs: input.durationMs,
        finished,
      },
    });

    return { ok: true };
  }),
});
