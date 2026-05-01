"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedCard } from "./feed-card";
import { Spinner } from "@nq/ui";

export function VerticalFeed() {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.feed.recommend.infiniteQueryOptions(
      { limit: 6 },
      { getNextPageParam: (last) => last.nextCursor },
    ),
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const items = React.useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActiveIdx(idx);
            if (idx >= items.length - 2 && query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll<HTMLElement>("[data-idx]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items.length, query]);

  if (query.isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/70">
        <Spinner /> <span className="ml-2 text-sm">加载推荐中…</span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/70">
        <div className="text-center">
          <p className="text-sm">暂无推荐内容</p>
          <p className="mt-1 text-xs text-white/40">去后台添加一些剧集吧</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="feed-snap no-scrollbar h-[100svh] w-full overflow-y-scroll bg-black">
      {items.map((it, idx) => (
        <div key={it.id} data-idx={idx}>
          <FeedCard item={it} active={idx === activeIdx} />
        </div>
      ))}
      {query.isFetchingNextPage && (
        <div className="flex h-16 items-center justify-center text-white/60">
          <Spinner />
        </div>
      )}
    </div>
  );
}
