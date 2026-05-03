"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Skeleton, Tabs, TabsList, TabsTrigger, Textarea } from "@nq/ui";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "待处理",
  PROCESSING: "处理中",
  CLOSED: "已关闭",
};

const CATEGORY_LABELS: Record<string, string> = {
  BUG: "Bug",
  SUGGESTION: "建议",
  CONTENT: "内容",
  PAYMENT: "充值",
  OTHER: "其他",
};

export default function FeedbackPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [status, setStatus] = React.useState<"OPEN" | "PROCESSING" | "CLOSED" | "ALL">("OPEN");
  const list = useInfiniteQuery(
    trpc.admin.feedback.list.infiniteQueryOptions(
      { limit: 20, status: status === "ALL" ? undefined : status },
      { getNextPageParam: (p) => p.nextCursor },
    ),
  );
  const update = useMutation({
    ...trpc.admin.feedback.update.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.feedback.list.queryKey() });
    },
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">意见反馈</h1>

      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <TabsList>
          <TabsTrigger value="OPEN">待处理</TabsTrigger>
          <TabsTrigger value="PROCESSING">处理中</TabsTrigger>
          <TabsTrigger value="CLOSED">已关闭</TabsTrigger>
          <TabsTrigger value="ALL">全部</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {list.isPending && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        {items.map((f) => (
          <FeedbackCard
            key={f.id}
            feedback={f}
            onSave={(p) => update.mutate({ id: f.id, ...p })}
            saving={update.isPending}
          />
        ))}
        {items.length === 0 && !list.isPending && (
          <p className="py-12 text-center text-sm text-muted-foreground">暂无反馈</p>
        )}
      </div>

      {list.hasNextPage && (
        <Button variant="outline" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
          加载更多
        </Button>
      )}
    </div>
  );
}

function FeedbackCard({
  feedback: f,
  onSave,
  saving,
}: {
  feedback: any;
  onSave: (p: { status?: any; reply?: string | null }) => void;
  saving: boolean;
}) {
  const [reply, setReply] = React.useState<string>(f.reply ?? "");

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{CATEGORY_LABELS[f.category]}</Badge>
          <Badge variant={f.status === "OPEN" ? "default" : f.status === "CLOSED" ? "secondary" : "outline"}>
            {STATUS_LABELS[f.status]}
          </Badge>
          <span>{f.email ?? f.userId ?? "匿名"}</span>
        </div>
        <span>{new Date(f.createdAt).toLocaleString("zh-CN")}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{f.content}</p>

      <div className="mt-3 space-y-2">
        <Textarea
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="回复内容（可选，仅记录用）"
        />
        <div className="flex gap-2">
          <Button size="sm" disabled={saving} onClick={() => onSave({ status: "PROCESSING", reply })}>
            标记处理中
          </Button>
          <Button size="sm" variant="secondary" disabled={saving} onClick={() => onSave({ status: "CLOSED", reply })}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
