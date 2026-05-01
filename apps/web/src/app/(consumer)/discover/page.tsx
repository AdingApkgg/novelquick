import Link from "next/link";
import { trpcServer } from "@/lib/trpc/server";
import { ROUTES, FEED_KEYS, LEADERBOARD_KEYS } from "@nq/shared/constants";
import { formatPlayCount } from "@nq/shared/utils";
import { Badge } from "@nq/ui";
import { Crown, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const trpc = await trpcServer();
  const [home, cats, hot] = await Promise.all([
    trpc.feed.home(),
    trpc.feed.categories(),
    trpc.feed.leaderboard({ key: LEADERBOARD_KEYS.HOT, limit: 10 }),
  ]);

  const banner = home.find((s) => s.key === FEED_KEYS.HOME_BANNER);
  const recommend = home.find((s) => s.key === FEED_KEYS.HOME_RECOMMEND);

  return (
    <div className="space-y-6 px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <h1 className="text-xl font-bold">发现</h1>

      {/* Banner carousel — basic horizontal scroll for now */}
      {banner && banner.items.length > 0 && (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
          {banner.items.map((it) => (
            <Link
              key={it.id}
              href={it.bannerUrl ?? (it.drama ? ROUTES.drama(it.drama.id) : "#")}
              className="relative aspect-[16/9] w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl bg-card"
            >
              {it.bannerImg && <img src={it.bannerImg} alt={it.title} className="h-full w-full object-cover" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                <p className="text-sm font-semibold text-shadow-strong">{it.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Category quick links */}
      <div className="grid grid-cols-4 gap-3">
        {cats.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            href={ROUTES.category(c.slug)}
            className="flex flex-col items-center gap-1 rounded-xl bg-card/40 py-3 text-xs text-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Flame className="h-5 w-5" />
            </div>
            <span>{c.name}</span>
          </Link>
        ))}
      </div>

      {/* 热播榜 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">热播榜</h2>
          <Link href="/rank" className="text-xs text-white/60">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-2">
          {hot.map((it) => (
            <Link
              key={it.drama.id}
              href={ROUTES.drama(it.drama.id)}
              className="flex items-center gap-3 rounded-xl bg-card/40 p-2"
            >
              <span className="w-6 text-center text-lg font-bold text-primary">{it.rank}</span>
              <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-md bg-card">
                {it.drama.cover && (
                  <img src={it.drama.cover} alt={it.drama.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-medium">{it.drama.title}</p>
                  {it.drama.isVip && (
                    <Badge variant="vip" className="text-[10px]">
                      <Crown className="mr-0.5 h-2.5 w-2.5" />
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-white/50">
                  {it.drama.totalEpisodes} 集 · {formatPlayCount(it.drama.playCount)} 次播放
                </p>
              </div>
            </Link>
          ))}
          {hot.length === 0 && <p className="text-xs text-white/40">暂无榜单数据</p>}
        </div>
      </section>

      {/* 推荐位 */}
      {recommend && recommend.items.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">小编精选</h2>
          <div className="grid grid-cols-3 gap-3">
            {recommend.items.map(
              (it) =>
                it.drama && (
                  <Link
                    key={it.id}
                    href={ROUTES.drama(it.drama.id)}
                    className="space-y-1.5"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
                      {it.drama.cover && (
                        <img src={it.drama.cover} alt={it.drama.title} className="h-full w-full object-cover" />
                      )}
                      {it.drama.isVip && (
                        <Badge variant="vip" className="absolute left-1.5 top-1.5 text-[10px]">
                          VIP
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs">{it.drama.title}</p>
                  </Link>
                ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
