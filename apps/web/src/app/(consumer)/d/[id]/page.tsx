import Link from "next/link";
import { notFound } from "next/navigation";
import { trpcServer } from "@/lib/trpc/server";
import { Badge, Button } from "@nq/ui";
import { Crown, Play, Lock } from "lucide-react";
import { ROUTES } from "@nq/shared/constants";
import { formatPlayCount } from "@nq/shared/utils";

export const dynamic = "force-dynamic";

export default async function DramaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trpc = await trpcServer();
  const drama = await trpc.drama.byId({ id }).catch(() => null);
  if (!drama) notFound();

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
            <p className="mt-2 text-xs text-white/50">
              {drama.totalEpisodes} 集 · {formatPlayCount(drama.playCount)} 次播放 · 评分 {drama.rating.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <Link href={ROUTES.watch(drama.id)}>
          <Button className="w-full" size="lg">
            <Play className="mr-1 h-4 w-4 fill-current" /> 立即播放
          </Button>
        </Link>

        {drama.description && (
          <p className="mt-4 text-sm leading-relaxed text-white/80">{drama.description}</p>
        )}

        <h2 className="mb-3 mt-6 text-base font-semibold">选集 ({drama.episodes.length})</h2>
        <div className="grid grid-cols-5 gap-2">
          {drama.episodes.map((ep) => (
            <Link
              key={ep.id}
              href={ROUTES.watch(drama.id, ep.index)}
              className="relative flex h-12 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-medium"
            >
              {ep.index}
              {!ep.isFree && ep.index > drama.freeEpisodes && (
                <Lock className="absolute right-1 top-1 h-2.5 w-2.5 text-amber-400" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
