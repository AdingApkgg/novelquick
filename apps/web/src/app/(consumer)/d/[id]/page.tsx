import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trpcServer } from "@/lib/trpc/server";
import { Badge, Button } from "@nq/ui";
import { Crown, Play, Lock, Star, Eye } from "lucide-react";
import { ROUTES } from "@nq/shared/constants";
import { formatPlayCount } from "@nq/shared/utils";
import { DramaComments } from "./comments";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const trpc = await trpcServer();
  const d = await trpc.drama.byId({ id }).catch(() => null);
  if (!d) return { title: "未找到" };
  const title = `${d.title}${d.subtitle ? ` · ${d.subtitle}` : ""}`;
  const desc = d.description?.slice(0, 140) ?? "短剧速看 · 沉浸式短剧观看";
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: d.cover ? [d.cover] : undefined,
      type: "video.tv_show",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: d.cover ? [d.cover] : undefined,
    },
  };
}

export default async function DramaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trpc = await trpcServer();
  const drama = await trpc.drama.byId({ id }).catch(() => null);
  if (!drama) notFound();

  const [progress, similar] = await Promise.all([
    trpc.drama.myProgress({ id }),
    trpc.drama.similar({ id, limit: 6 }),
  ]);

  const continueIndex = progress?.episodeIndex ?? 1;
  const continueLabel = progress
    ? `继续观看 第${progress.episodeIndex}集`
    : "立即播放";

  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden">
        {drama.cover && (
          <img src={drama.cover} alt={drama.title} className="h-full w-full object-cover blur-xl scale-110 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />
        <div className="absolute inset-x-0 bottom-0 flex gap-4 px-4">
          <div className="aspect-[3/4] w-28 shrink-0 -translate-y-6 overflow-hidden rounded-lg bg-card shadow-2xl">
            {drama.cover && <img src={drama.cover} alt={drama.title} className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 pb-4">
            <h1 className="text-2xl font-bold">{drama.title}</h1>
            {drama.subtitle && <p className="mt-1 text-sm text-white/60">{drama.subtitle}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {drama.isVip && (
                <Badge variant="vip" className="text-[10px]">
                  <Crown className="mr-0.5 h-3 w-3" /> VIP
                </Badge>
              )}
              {drama.tags.slice(0, 3).map((t) => (
                <Badge key={t.id} variant="secondary" className="text-[10px]">
                  {t.name}
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-400" /> {drama.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" /> {formatPlayCount(drama.playCount)}
              </span>
              <span>共 {drama.totalEpisodes} 集</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Continue / Play */}
        <Link href={ROUTES.watch(drama.id, continueIndex)}>
          <Button className="w-full" size="lg">
            <Play className="mr-1 h-4 w-4 fill-current" /> {continueLabel}
          </Button>
        </Link>

        {/* Resume progress bar */}
        {progress && progress.durationMs > 0 && !progress.finished && (
          <div className="mt-3 rounded-md bg-card/50 px-3 py-2 text-xs text-muted-foreground">
            <p>
              上次看到 第 {progress.episodeIndex} 集 · {Math.round((progress.positionMs / progress.durationMs) * 100)}%
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-primary"
                style={{ width: `${(progress.positionMs / progress.durationMs) * 100}%` }}
              />
            </div>
          </div>
        )}

        {drama.description && (
          <p className="mt-4 text-sm leading-relaxed text-white/80">{drama.description}</p>
        )}

        {/* Episodes */}
        <h2 className="mb-3 mt-6 text-base font-semibold">选集 ({drama.episodes.length})</h2>
        <div className="grid grid-cols-5 gap-2">
          {drama.episodes.map((ep) => {
            const watched = progress && ep.index === progress.episodeIndex;
            const locked = !ep.isFree && ep.index > drama.freeEpisodes;
            return (
              <Link
                key={ep.id}
                href={ROUTES.watch(drama.id, ep.index)}
                className={`relative flex h-12 items-center justify-center rounded-md border text-sm font-medium ${
                  watched
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {ep.index}
                {locked && <Lock className="absolute right-1 top-1 h-2.5 w-2.5 text-amber-400" />}
              </Link>
            );
          })}
        </div>

        {/* Comments */}
        <DramaComments dramaId={drama.id} />

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">相似推荐</h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
              {similar.map((s) => (
                <Link
                  key={s.id}
                  href={ROUTES.drama(s.id)}
                  className="w-28 shrink-0 snap-start space-y-1.5"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
                    {s.cover && <img src={s.cover} alt={s.title} className="h-full w-full object-cover" />}
                    {s.isVip && (
                      <Badge variant="vip" className="absolute left-1 top-1 text-[9px]">
                        VIP
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs">{s.title}</p>
                  <p className="truncate text-[10px] text-white/40">
                    {s.totalEpisodes} 集 · {formatPlayCount(s.playCount)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
