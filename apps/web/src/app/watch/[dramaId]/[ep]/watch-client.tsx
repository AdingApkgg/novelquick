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
  Settings2,
  PictureInPicture2,
  Gauge,
  X,
  Volume2,
  VolumeX,
  Volume1,
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

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

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
  const [speed, setSpeed] = React.useState<number>(1);
  const [pipActive, setPipActive] = React.useState(false);
  const [autoNextSec, setAutoNextSec] = React.useState<number | null>(null);
  const cancelAutoNextRef = React.useRef(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [showVolume, setShowVolume] = React.useState(false);
  const [seekHint, setSeekHint] = React.useState<{ delta: number; show: boolean } | null>(null);

  // Find next playable episode
  const nextEpisode = React.useMemo(
    () => data.episodes.find((e) => e.index === data.episode.index + 1 && !e.locked),
    [data.episode.index, data.episodes],
  );

  // Persist speed preference
  React.useEffect(() => {
    try {
      const v = localStorage.getItem("nq_speed");
      if (v) setSpeed(parseFloat(v) || 1);
    } catch {}
  }, []);
  React.useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
    try {
      localStorage.setItem("nq_speed", String(speed));
    } catch {}
  }, [speed, data.episode.id]);

  // Progress reporting
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

  // Reset countdown when episode changes
  React.useEffect(() => {
    setAutoNextSec(null);
    cancelAutoNextRef.current = false;
  }, [data.episode.id]);

  // Persist volume
  React.useEffect(() => {
    try {
      const v = localStorage.getItem("nq_volume");
      if (v) setVolume(Math.min(1, Math.max(0, parseFloat(v) || 1)));
    } catch {}
  }, []);
  React.useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.volume = volume;
      v.muted = muted;
    }
    try {
      localStorage.setItem("nq_volume", String(volume));
    } catch {}
  }, [volume, muted, data.episode.id]);

  // Keyboard shortcuts: space (play/pause), arrows (seek/volume), m (mute), f (fullscreen)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ignore shortcuts when typing
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const v = videoRef.current;
      if (!v) return;
      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          if (v.paused) {
            v.play();
            setPaused(false);
          } else {
            v.pause();
            setPaused(true);
          }
          break;
        case "arrowleft":
          v.currentTime = Math.max(0, v.currentTime - 5);
          showSeekHint(-5);
          break;
        case "arrowright":
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
          showSeekHint(5);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume((x) => Math.min(1, x + 0.1));
          setShowVolume(true);
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume((x) => Math.max(0, x - 0.1));
          setShowVolume(true);
          break;
        case "m":
          setMuted((m) => !m);
          break;
        case "f":
          if (document.fullscreenElement) document.exitFullscreen();
          else v.requestFullscreen?.();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Hide volume slider after 1.5s idle
  React.useEffect(() => {
    if (!showVolume) return;
    const t = setTimeout(() => setShowVolume(false), 1500);
    return () => clearTimeout(t);
  }, [showVolume, volume]);

  function showSeekHint(delta: number) {
    setSeekHint({ delta, show: true });
    setTimeout(() => setSeekHint(null), 700);
  }

  // Double-tap seek
  const lastTapRef = React.useRef<{ t: number; x: number } | null>(null);
  const handleVideoTap = (e: React.MouseEvent) => {
    const v = videoRef.current;
    if (!v) return;
    const now = Date.now();
    const last = lastTapRef.current;
    const x = e.clientX;
    const w = (e.currentTarget as HTMLElement).clientWidth;
    if (last && now - last.t < 300 && Math.abs(last.x - x) < 60) {
      // double-tap detected
      if (x < w / 3) {
        v.currentTime = Math.max(0, v.currentTime - 10);
        showSeekHint(-10);
      } else if (x > (w * 2) / 3) {
        v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
        showSeekHint(10);
      } else {
        togglePlay();
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { t: now, x };
      // single-tap (deferred): toggle play after 250ms if no second tap
      setTimeout(() => {
        if (lastTapRef.current && lastTapRef.current.t === now) {
          togglePlay();
          lastTapRef.current = null;
        }
      }, 280);
    }
  };

  const likeMut = useMutation(trpc.interact.toggleLike.mutationOptions());
  const favMut = useMutation(trpc.interact.toggleFavorite.mutationOptions());
  const followMut = useMutation(trpc.interact.toggleFollow.mutationOptions());

  const goEpisode = (index: number) => router.push(`/watch/${dramaId}/${index}`);

  const onTimeUpdate = React.useCallback(
    (pos: number, dur: number) => {
      setProgress({ pos, dur });
      // start auto-next countdown 5s before end
      if (
        nextEpisode &&
        !cancelAutoNextRef.current &&
        dur > 0 &&
        dur - pos <= 5000 &&
        dur - pos > 0
      ) {
        const sec = Math.ceil((dur - pos) / 1000);
        setAutoNextSec(sec);
      }
    },
    [nextEpisode],
  );

  const onEnded = React.useCallback(() => {
    if (cancelAutoNextRef.current) return;
    if (nextEpisode) goEpisode(nextEpisode.index);
  }, [nextEpisode]);

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

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPipActive(false);
      } else {
        await v.requestPictureInPicture();
        setPipActive(true);
      }
    } catch (e) {
      toast.error("当前浏览器不支持画中画");
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
          onClick={handleVideoTap}
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
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
        >
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
        <div className="flex items-center gap-1">
          <button
            className="rounded-full bg-black/40 px-2 py-1 text-xs backdrop-blur-sm"
            onClick={() => setShowDanmaku((v) => !v)}
          >
            弹{showDanmaku ? "开" : "关"}
          </button>
        </div>
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
              { onSuccess: () => qc.invalidateQueries({ queryKey: trpc.episode.watch.queryKey() }) },
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
              { onSuccess: () => qc.invalidateQueries({ queryKey: trpc.episode.watch.queryKey() }) },
            );
          }}
        />
        <ActionButton
          icon={<Share2 className="h-7 w-7" />}
          label="分享"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: data.drama.title, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("链接已复制");
            }
          }}
        />
        <EpisodeListSheet
          episodes={data.episodes}
          currentIndex={data.episode.index}
          onPick={goEpisode}
          totalEpisodes={data.drama.totalEpisodes}
        />
        <SpeedSheet speed={speed} onChange={setSpeed} />
        <VolumeControl
          muted={muted}
          volume={volume}
          show={showVolume}
          onToggleMute={() => setMuted((m) => !m)}
          onChange={(v) => {
            setVolume(v);
            setMuted(false);
            setShowVolume(true);
          }}
          onShow={() => setShowVolume(true)}
        />
        <ActionButton
          icon={<PictureInPicture2 className={`h-7 w-7 ${pipActive ? "text-primary" : ""}`} />}
          label="画中画"
          onClick={togglePip}
        />
      </div>

      {/* Seek hint overlay */}
      {seekHint && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
          {seekHint.delta > 0 ? `快进 ${seekHint.delta}s ›` : `‹ 快退 ${Math.abs(seekHint.delta)}s`}
        </div>
      )}

      {/* Bottom info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 px-4 pb-2 text-white">
        <div className="pointer-events-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-shadow-strong">{data.drama.title}</h1>
            <p className="truncate text-xs text-white/80 text-shadow-strong">
              第 {data.episode.index} 集 · 共 {data.drama.totalEpisodes} 集 · {speed}× 速度
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

      {/* Auto-next overlay */}
      {autoNextSec !== null && autoNextSec > 0 && nextEpisode && (
        <div className="absolute right-3 top-20 z-40 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-md">
          <span>
            {autoNextSec}s 后播放第 {nextEpisode.index} 集
          </span>
          <button
            onClick={() => {
              cancelAutoNextRef.current = true;
              setAutoNextSec(null);
            }}
            className="rounded-full bg-white/15 p-1 hover:bg-white/30"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
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

function VolumeControl({
  muted,
  volume,
  show,
  onToggleMute,
  onChange,
  onShow,
}: {
  muted: boolean;
  volume: number;
  show: boolean;
  onToggleMute: () => void;
  onChange: (v: number) => void;
  onShow: () => void;
}) {
  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  return (
    <div className="relative">
      <button onClick={onToggleMute} onMouseEnter={onShow} className="flex flex-col items-center gap-1 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <Icon className="h-7 w-7" />
        </div>
        <span className="text-[11px]">{muted ? "静音" : `${Math.round(volume * 100)}%`}</span>
      </button>
      {show && (
        <div
          className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 backdrop-blur-md"
          onMouseEnter={onShow}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
            className="h-1 w-32 cursor-pointer accent-primary"
          />
        </div>
      )}
    </div>
  );
}

function SpeedSheet({ speed, onChange }: { speed: number; onChange: (s: number) => void }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center gap-1 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Gauge className="h-7 w-7" />
          </div>
          <span className="text-[11px]">{speed}×</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-card text-foreground">
        <SheetHeader>
          <SheetTitle>播放速度</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-5 gap-2 p-4">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`rounded-md border py-2 text-sm ${
                s === speed ? "border-primary bg-primary/15 text-primary" : "border-border/30 hover:bg-accent"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
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
