"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon, X, History, Trash2 } from "lucide-react";
import { Input, Skeleton, Badge } from "@nq/ui";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@nq/shared/constants";
import { formatPlayCount } from "@nq/shared/utils";

const HISTORY_KEY = "nq_search_history";
const HISTORY_MAX = 10;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveHistory(list: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch {}
}

export default function SearchPage() {
  const trpc = useTRPC();
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);

  React.useEffect(() => setHistory(loadHistory()), []);

  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const trending = useQuery(trpc.search.trending.queryOptions());
  const results = useQuery({
    ...trpc.search.query.queryOptions({ q: debouncedQ, limit: 30 }),
    enabled: debouncedQ.length > 0,
  });

  const addToHistory = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...history.filter((x) => x !== t)].slice(0, HISTORY_MAX);
    setHistory(next);
    saveHistory(next);
  };

  const removeFromHistory = (term: string) => {
    const next = history.filter((x) => x !== term);
    setHistory(next);
    saveHistory(next);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) addToHistory(q);
        }}
        className="relative"
      >
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
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            onClick={() => setQ("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {!debouncedQ && (
        <>
          {history.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
                  <History className="h-3.5 w-3.5" /> 搜索历史
                </h3>
                <button onClick={clearHistory} className="flex items-center gap-1 text-xs text-white/50 hover:text-white">
                  <Trash2 className="h-3 w-3" /> 清空
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <span
                    key={h}
                    className="group inline-flex items-center gap-1 rounded-full bg-white/5 pl-3 pr-1.5 py-1.5 text-xs"
                  >
                    <button onClick={() => setQ(h)}>{h}</button>
                    <button
                      onClick={() => removeFromHistory(h)}
                      className="ml-0.5 rounded-full p-0.5 text-white/40 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-white/80">热搜</h3>
            <div className="flex flex-wrap gap-2">
              {trending.data?.map((d, i) => (
                <Link
                  key={d.id}
                  href={ROUTES.drama(d.id)}
                  className="rounded-full bg-white/5 px-3 py-1.5 text-xs"
                  onClick={() => addToHistory(d.title)}
                >
                  <span className={i < 3 ? "text-primary" : "text-white/60"}>{i + 1}.</span> {d.title}
                </Link>
              ))}
              {trending.isPending &&
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-20" />)}
            </div>
          </section>
        </>
      )}

      {debouncedQ && (
        <section className="mt-4 space-y-3 pb-20">
          {results.isPending && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          {results.data?.map((d) => (
            <Link
              key={d.id}
              href={ROUTES.drama(d.id)}
              onClick={() => addToHistory(debouncedQ)}
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
