"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Bookmark, MessageCircle, Share2, Play, Crown } from "lucide-react";
import { Badge } from "@nq/ui";
import { formatPlayCount } from "@nq/shared/utils";
import { ROUTES } from "@nq/shared/constants";
import { HlsVideo } from "@/components/player/hls-video";
import type { FeedItem } from "@nq/shared/types";

export function FeedCard({ item, active }: { item: FeedItem; active: boolean }) {
  const [muted, setMuted] = React.useState(true);
  const hasTrailer = !!item.trailerUrl;

  return (
    <div className="feed-snap-item relative h-[100svh] w-full overflow-hidden bg-black">
      {/* Background art */}
      {item.drama.poster && (
        <img
          src={item.drama.poster}
          alt={item.drama.title}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
      )}

      {/* Trailer (when present) layered above the poster */}
      {hasTrailer && (
        <HlsVideo
          src={item.trailerUrl}
          active={active}
          muted={muted}
          className="absolute inset-0 h-full w-full object-cover"
          onClick={() => setMuted((m) => !m)}
        />
      )}

      {/* Vignette overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />

      {/* Right-side actions */}
      <div className="absolute bottom-32 right-3 z-10 flex flex-col items-center gap-5 text-white text-shadow-strong">
        <ActionIcon icon={<Heart className="h-7 w-7" />} label={String(formatPlayCount(item.drama.playCount))} />
        <ActionIcon icon={<MessageCircle className="h-7 w-7" />} label="评论" />
        <ActionIcon icon={<Bookmark className="h-7 w-7" />} label="追剧" />
        <ActionIcon icon={<Share2 className="h-7 w-7" />} label="分享" />
      </div>

      {/* Bottom info + CTA */}
      <div className="absolute inset-x-0 bottom-20 z-10 px-4 pb-4 text-white">
        <div className="mb-2 flex items-center gap-2">
          {item.drama.isVip && (
            <Badge variant="vip" className="text-[10px]">
              <Crown className="mr-1 h-3 w-3" /> VIP
            </Badge>
          )}
          <span className="text-xs text-white/80 text-shadow-strong">
            共 {item.drama.totalEpisodes} 集 · {formatPlayCount(item.drama.playCount)} 次播放
          </span>
        </div>
        <h2 className="text-2xl font-bold leading-tight text-shadow-strong">{item.drama.title}</h2>
        {item.drama.description && (
          <p className="mt-2 line-clamp-2 text-sm text-white/80 text-shadow-strong">{item.drama.description}</p>
        )}
        <Link
          href={ROUTES.watch(item.drama.id)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg active:scale-95 transition-transform"
        >
          <Play className="h-4 w-4 fill-current" />
          立即观看
        </Link>
      </div>
    </div>
  );
}

function ActionIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
        {icon}
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
}
