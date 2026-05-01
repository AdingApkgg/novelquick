"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  MessageCircle,
  Share2,
  ListVideo,
  Crown,
  Lock,
  Play,
  Pause,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  Button,
  Spinner,
  Badge,
} from "@nq/ui";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ROUTES, PLAYER } from "@nq/shared/constants";
import { formatDuration, formatPlayCount } from "@nq/shared/utils";
import { HlsVideo } from "@/components/player/hls-video";
import { CommentSheet } from "./comment-sheet";
import { DanmakuLayer } from "./danmaku-layer";
import { UnlockSheet } from "./unlock-sheet";
import { toast } from "sonner";
import type { WatchPayload } from "@nq/shared/types";

export function WatchClient({ dramaId, initial }: { dramaId: string; initial: WatchPayload }) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const router = useRouter();

  const watch = useQuery({
    ...trpc.episode.watch.queryOptions({ dramaId, index: initial.episode.index }),
    initialData: initial,
  });
  const data = watch.data ?? initial;

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = React.useState(false);
  const [progress, setProgress] = React.useState({ pos: data.positionMs, dur: data.episode.duration * 1000 });
  const [showDanmaku, setShowDanmaku] = React.useState(true);

  const reportMut = useMutation(trpc.episode.reportProgress.mutationOptions());
  React.useEffect(() => {
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || v.duration === 0) return;
      reportMut.mutate({
        episodeId: data.episode.id,
        positionMs: Math.floor(v.currentTime * 1000),
        durationMs: Math.floor(v.duration * 1000),
      });
    }, PLAYER.PROGRESS_REPORT_MS);
    return () => clearInterval(id);
  }, [data.episode.id, reportMut]);

  // Resume position
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || data.positionMs <= 0) return;
    const seek = () => {
      v.currentTime = data.positionMs / 1000;
      v.removeEventListener("loadedmetadata", seek);
    };
    v.addEventListener("loadedmetadata", seek);
  }, [data.positionMs, data.episode.id]);

  const likeMut = useMutation(trpc.interact.toggleLike.mutationOptions());
  const favMut = useMutation(trpc.interact.toggleFavorite.mutationOptions());
  const followMut = useMutation(trpc.interact.toggleFollow.mutationOptions());

  const goEpisode = (index: number) => router.push(`/watch/${dramaId}/${index}`);

  const onTimeUpdate = React.useCallback((pos: number, dur: number) => setProgress({ pos, dur }), []);

  const onEnded = React.useCallback(() => {
    const next = data.episodes.find((e) => e.index === data.episode.index + 1);
    if (next && !next.locked) goEpisode(next.index);
  }, [data.episode.index, data.episodes]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-black">
      {/* Player */}
      {data.episode.hlsUrl ? (
        <HlsVideo
          ref={videoRef}
          src={data.episode.hlsUrl}
          active={true}
          autoPlay
          muted={false}
          className="h-full w-full object-contain"
          onTimeUpdateMs={onTimeUpdate}
          onEnded={onEnded}
          onClick={togglePlay}
        />
      ) : data.episode.locked ? (
        <LockedView dramaId={dramaId} episode={data.episode} drama={data.drama} />
      ) : (
        <div className="flex h-full items-center justify-center text-white/70">
          <Spinner /> <span className="ml-2 text-sm">加载视频中…</span>
        </div>
      )}

      {/* Danmaku layer */}
      {showDanmaku && data.episode.hlsUrl && (
        <DanmakuLayer episodeId={data.episode.id} videoRef={videoRef} positionMs={progress.pos} />
      )}

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+10px)] text-white">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {data.drama.isVip && (
            <Badge variant="vip" className="text-[10px]">
              <Crown className="mr-0.5 h-3 w-3" /> VIP
            </Badge>
          )}
          <p className="text-sm font-medium text-shadow-strong">第 {data.episode.index} 集</p>
        </div>
        <button
          className="rounded-full bg-black/40 px-2 py-1 text-xs backdrop-blur-sm"
          onClick={() => setShowDanmaku((v) => !v)}
        >
          弹{showDanmaku ? "开" : "关"}
        </button>
      </div>

      {/* Center play/pause overlay */}
      {paused && (
        <button
          onClick={togglePlay}
          className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/30 text-white"
        >
          <Play className="h-16 w-16 fill-current opacity-80" />
        </button>
      )}

      {/* Right action rail */}
      <div className="absolute bottom-32 right-2 z-30 flex flex-col items-center gap-4 text-white text-shadow-strong">
        <ActionButton
          icon={<Heart className={`h-7 w-7 ${data.drama.liked ? "fill-primary text-primary" : ""}`} />}
          label={String(data.drama.likeCount)}
          onClick={() => {
            likeMut.mutate(
              { dramaId },
              {
                onSuccess: () => qc.invalidateQueries({ queryKey: trpc.episode.watch.queryKey() }),
              },
            );
          }}
        />
        <CommentSheet dramaId={dramaId} episodeId={data.episode.id}>
          <ActionButton icon={<MessageCircle className="h-7 w-7" />} label="评论" />
        </CommentSheet>
        <ActionButton
          icon={<Bookmark className={`h-7 w-7 ${data.drama.favorited ? "fill-primary text-primary" : ""}`} />}
          label={String(data.drama.favoriteCount)}
          onClick={() => {
            favMut.mutate(
              { dramaId },
              {
                onSuccess: () => qc.invalidateQueries({ queryKey: trpc.episode.watch.queryKey() }),
              },
            );
          }}
        />
        <ActionButton
          icon={<Share2 className="h-7 w-7" />}
          label="分享"
          onClick={() => {
            navigator.share?.({ title: data.drama.title, url: window.location.href }).catch(() => {});
          }}
        />
        <EpisodeListSheet
          episodes={data.episodes}
          currentIndex={data.episode.index}
          onPick={goEpisode}
          totalEpisodes={data.drama.totalEpisodes}
        />
      </div>

      {/* Bottom info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 px-4 pb-2 text-white">
        <div className="pointer-events-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-shadow-strong">{data.drama.title}</h1>
            <p className="truncate text-xs text-white/80 text-shadow-strong">
              第 {data.episode.index} 集 · 共 {data.drama.totalEpisodes} 集
            </p>
          </div>
          <Button
            size="sm"
            variant={data.drama.followed ? "secondary" : "default"}
            onClick={() =>
              followMut.mutate(
                { dramaId },
                {
                  onSuccess: (r) => {
                    toast.success(r.followed ? "已加入追剧" : "已取消追剧");
                    qc.invalidateQueries({ queryKey: trpc.episode.watch.queryKey() });
                  },
                },
              )
            }
          >
            {data.drama.followed ? "已追" : "追剧"}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="pointer-events-auto mt-2">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>{formatDuration(progress.pos)}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-0.5 rounded-full bg-primary"
                style={{
                  width: progress.dur > 0 ? `${(progress.pos / progress.dur) * 100}%` : "0%",
                }}
              />
            </div>
            <span>{formatDuration(progress.dur)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition active:scale-90">
        {icon}
      </div>
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function EpisodeListSheet({
  episodes,
  currentIndex,
  onPick,
  totalEpisodes,
}: {
  episodes: WatchPayload["episodes"];
  currentIndex: number;
  onPick: (i: number) => void;
  totalEpisodes: number;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center gap-1 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <ListVideo className="h-7 w-7" />
          </div>
          <span className="text-[11px]">选集</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto bg-card text-foreground">
        <SheetHeader>
          <SheetTitle>选集 ({totalEpisodes})</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-5 gap-2 p-4 sm:grid-cols-8">
          {episodes.map((e) => (
            <button
              key={e.id}
              onClick={() => onPick(e.index)}
              className={`relative flex h-12 items-center justify-center rounded-md border text-sm font-semibold ${
                e.index === currentIndex
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/30 bg-card hover:bg-accent"
              }`}
            >
              {e.index}
              {e.locked && <Lock className="absolute right-1 top-1 h-2.5 w-2.5 text-amber-400" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LockedView({
  dramaId,
  episode,
  drama,
}: {
  dramaId: string;
  episode: WatchPayload["episode"];
  drama: WatchPayload["drama"];
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="rounded-full bg-amber-500/15 p-4">
        <Lock className="h-9 w-9 text-amber-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">本集需要解锁</h2>
      <p className="mt-1 text-sm text-white/60">
        前 {drama.freeEpisodes} 集免费观看，第 {episode.index} 集请选择以下方式解锁
      </p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:max-w-xs">
        <UnlockSheet episodeId={episode.id} drama={drama} />
        <Link
          href={ROUTES.vip}
          className="rounded-full border border-amber-400/50 px-4 py-2 text-sm text-amber-300"
        >
          开通 VIP 全集免费
        </Link>
      </div>
    </div>
  );
}
