"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";
import { Input, Skeleton, Badge } from "@nq/ui";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@nq/shared/constants";
import { formatPlayCount } from "@nq/shared/utils";

export default function SearchPage() {
  const trpc = useTRPC();
  const [q, setQ] = React.useState("");
  const trending = useQuery(trpc.search.trending.queryOptions());
  const results = useQuery({
    ...trpc.search.query.queryOptions({ q, limit: 30 }),
    enabled: q.length > 0,
  });

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          autoFocus
          placeholder="搜索剧名 / 演员 / 标签"
          className="h-11 rounded-full border-white/15 bg-white/5 pl-10 pr-10 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            onClick={() => setQ("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!q && (
        <section className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-white/80">热搜</h3>
          <div className="flex flex-wrap gap-2">
            {trending.data?.map((d, i) => (
              <Link
                key={d.id}
                href={ROUTES.drama(d.id)}
                className="rounded-full bg-white/5 px-3 py-1.5 text-xs"
              >
                {i + 1}. {d.title}
              </Link>
            ))}
            {trending.isPending && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-20" />)}
          </div>
        </section>
      )}

      {q && (
        <section className="mt-4 space-y-3 pb-20">
          {results.isPending && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          {results.data?.map((d) => (
            <Link
              key={d.id}
              href={ROUTES.drama(d.id)}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5"
            >
              <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-md">
                {d.cover && <img src={d.cover} alt={d.title} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate font-medium">{d.title}</p>
                  {d.isVip && (
                    <Badge variant="vip" className="text-[10px]">
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-white/50">
                  {d.totalEpisodes} 集 · {formatPlayCount(d.playCount)} 次播放 · 评分 {d.rating.toFixed(1)}
                </p>
              </div>
            </Link>
          ))}
          {results.data && results.data.length === 0 && (
            <p className="py-12 text-center text-sm text-white/40">没有找到相关结果</p>
          )}
        </section>
      )}
    </div>
  );
}
