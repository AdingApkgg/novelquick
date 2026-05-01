"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Switch, Label } from "@nq/ui";
import { toast } from "sonner";

export default function FeedPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const slots = useQuery(trpc.admin.feed.listSlots.queryOptions());
  const upsertSlot = useMutation({
    ...trpc.admin.feed.upsertSlot.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.admin.feed.listSlots.queryKey() }),
  });
  const upsertItem = useMutation({
    ...trpc.admin.feed.upsertItem.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.feed.listSlots.queryKey() });
    },
  });
  const removeItem = useMutation({
    ...trpc.admin.feed.removeItem.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.admin.feed.listSlots.queryKey() }),
  });

  const dramas = useQuery(trpc.admin.drama.list.queryOptions({ limit: 100 }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">推荐位 / Banner</h1>
      <p className="text-sm text-muted-foreground">
        管理首页 Banner、热播推荐、新剧上线等推荐位的内容
      </p>
      {slots.data?.map((slot) => (
        <Card key={slot.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{slot.name}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                key: <code>{slot.key}</code> · 位置: {slot.position}
              </p>
            </div>
            <Switch
              checked={slot.isActive}
              onCheckedChange={(v) =>
                upsertSlot.mutate({
                  id: slot.id,
                  key: slot.key,
                  name: slot.name,
                  position: slot.position,
                  isActive: v,
                })
              }
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {slot.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded border p-2">
                {item.bannerImg && <img src={item.bannerImg} className="h-10 w-16 rounded object-cover" />}
                <span className="flex-1 text-sm">{item.title ?? item.drama?.title ?? "未命名"}</span>
                <button className="text-xs text-destructive" onClick={() => removeItem.mutate({ id: item.id })}>
                  删除
                </button>
              </div>
            ))}

            <AddItem
              slotId={slot.id}
              dramas={dramas.data?.items ?? []}
              onSubmit={(payload) => upsertItem.mutate(payload)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AddItem({
  slotId,
  dramas,
  onSubmit,
}: {
  slotId: string;
  dramas: { id: string; title: string }[];
  onSubmit: (p: any) => void;
}) {
  const [dramaId, setDramaId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [bannerImg, setBannerImg] = React.useState("");

  return (
    <div className="grid grid-cols-4 gap-2 rounded border bg-muted/20 p-2">
      <select
        className="h-9 rounded border bg-background px-2 text-sm"
        value={dramaId}
        onChange={(e) => setDramaId(e.target.value)}
      >
        <option value="">选择剧集...</option>
        {dramas.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </select>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="自定义标题" />
      <Input value={bannerImg} onChange={(e) => setBannerImg(e.target.value)} placeholder="Banner 图 URL" />
      <Button
        onClick={() => {
          if (!dramaId && !bannerImg) return;
          onSubmit({
            slotId,
            dramaId: dramaId || null,
            title: title || null,
            bannerImg: bannerImg || null,
            sortOrder: 0,
          });
          setDramaId("");
          setTitle("");
          setBannerImg("");
        }}
      >
        添加
      </Button>
    </div>
  );
}
