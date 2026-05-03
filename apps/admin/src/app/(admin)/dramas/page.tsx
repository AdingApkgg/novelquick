"use client";

import * as React from "react";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Skeleton, Badge } from "@nq/ui";
import { Plus, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function DramasPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const list = useInfiniteQuery(
    trpc.admin.drama.list.infiniteQueryOptions(
      { q, limit: 20 },
      { getNextPageParam: (l) => l.nextCursor },
    ),
  );

  const del = useMutation({
    ...trpc.admin.drama.delete.mutationOptions(),
    onSuccess: () => {
      toast.success("已删除");
      qc.invalidateQueries({ queryKey: trpc.admin.drama.list.queryKey() });
    },
  });

  const bulk = useMutation({
    ...trpc.admin.drama.bulkSetStatus.mutationOptions(),
    onSuccess: (r) => {
      toast.success(`已更新 ${r.count} 条`);
      qc.invalidateQueries({ queryKey: trpc.admin.drama.list.queryKey() });
      setSelected(new Set());
    },
    onError: (e) => toast.error(e.message),
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const allSelected = items.length > 0 && items.every((d) => selected.has(d.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((d) => d.id)));
  };
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const webBase = process.env.NEXT_PUBLIC_WEB_URL ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">剧集管理</h1>
        <Link href="/dramas/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> 新增剧集
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索剧名" className="pl-9" />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">已选 {selected.size} 项</span>
            <Button
              size="sm"
              onClick={() => bulk.mutate({ ids: [...selected], status: "PUBLISHED" })}
              disabled={bulk.isPending}
            >
              批量上架
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => bulk.mutate({ ids: [...selected], status: "OFFLINE" })}
              disabled={bulk.isPending}
            >
              批量下架
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-8 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-left">剧名</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-left">集数</th>
              <th className="px-4 py-3 text-left">VIP</th>
              <th className="px-4 py-3 text-left">播放量</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="p-2">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))}
            {items.map((d) => (
              <tr key={d.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} />
                </td>
                <td className="px-4 py-3 font-medium">{d.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={d.status === "PUBLISHED" ? "default" : "secondary"}>{d.status}</Badge>
                </td>
                <td className="px-4 py-3">{d._count.episodes}</td>
                <td className="px-4 py-3">{d.isVip ? "是" : "否"}</td>
                <td className="px-4 py-3">{d.playCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {webBase && (
                    <a
                      href={`${webBase}/d/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-3 inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
                    >
                      预览 <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <Link href={`/dramas/${d.id}`} className="mr-3 text-primary">
                    编辑
                  </Link>
                  <button
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`确认删除"${d.title}"？`)) del.mutate({ id: d.id });
                    }}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !list.isPending && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  没有数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {list.hasNextPage && (
        <Button variant="outline" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
          加载更多
        </Button>
      )}
    </div>
  );
}
