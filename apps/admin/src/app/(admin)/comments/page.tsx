"use client";

import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@nq/ui";
import { toast } from "sonner";

export default function CommentsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const list = useInfiniteQuery(
    trpc.admin.comment.list.infiniteQueryOptions({}, { getNextPageParam: (p) => p.nextCursor }),
  );
  const moderate = useMutation({
    ...trpc.admin.comment.moderate.mutationOptions(),
    onSuccess: () => {
      toast.success("已处理");
      qc.invalidateQueries({ queryKey: trpc.admin.comment.list.queryKey() });
    },
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">评论审核</h1>
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {c.user.displayName ?? c.user.email} · 在 {c.drama?.title ?? c.episode?.title ?? "—"}
              </span>
              <Badge variant={c.status === "VISIBLE" ? "default" : "secondary"}>{c.status}</Badge>
            </div>
            <p className="mt-2 text-sm">{c.content}</p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => moderate.mutate({ id: c.id, status: "HIDDEN" })}
              >
                隐藏
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => moderate.mutate({ id: c.id, status: "DELETED" })}
              >
                删除
              </Button>
              <Button size="sm" onClick={() => moderate.mutate({ id: c.id, status: "VISIBLE" })}>
                通过
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && !list.isPending && (
          <p className="py-12 text-center text-sm text-muted-foreground">暂无评论</p>
        )}
      </div>
    </div>
  );
}
