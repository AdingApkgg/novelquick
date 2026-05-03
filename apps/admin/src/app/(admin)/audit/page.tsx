"use client";

import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Badge, Skeleton, Button } from "@nq/ui";

export default function AuditPage() {
  const trpc = useTRPC();
  const list = useInfiniteQuery(
    trpc.admin.audit.list.infiniteQueryOptions({ limit: 50 }, { getNextPageParam: (p) => p.nextCursor }),
  );
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">操作日志</h1>
      <p className="text-sm text-muted-foreground">所有管理员操作的审计记录</p>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">时间</th>
              <th className="px-4 py-3 text-left">操作人</th>
              <th className="px-4 py-3 text-left">动作</th>
              <th className="px-4 py-3 text-left">资源</th>
              <th className="px-4 py-3 text-left">资源 ID</th>
              <th className="px-4 py-3 text-left">详情</th>
            </tr>
          </thead>
          <tbody>
            {list.isPending && (
              <tr>
                <td colSpan={6}>
                  <Skeleton className="h-10 w-full" />
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {new Date(it.createdAt).toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-2">{it.actor?.email ?? it.actor?.displayName ?? "system"}</td>
                <td className="px-4 py-2">
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {it.action}
                  </Badge>
                </td>
                <td className="px-4 py-2">{it.resource}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {it.resourceId?.slice(0, 8) ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <details>
                    <summary className="cursor-pointer text-xs text-primary">查看</summary>
                    <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted/50 p-2 text-[10px]">
                      {JSON.stringify({ before: it.before, after: it.after }, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
            {items.length === 0 && !list.isPending && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  暂无操作日志
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
