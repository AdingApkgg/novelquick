"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Switch, Card, CardContent, Badge } from "@nq/ui";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function EpisodeManager({ dramaId, freeEpisodes }: { dramaId: string; freeEpisodes: number }) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const list = useQuery(trpc.admin.episode.list.queryOptions({ dramaId }));

  const create = useMutation({
    ...trpc.admin.episode.create.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.admin.episode.list.queryKey() }),
  });
  const update = useMutation({
    ...trpc.admin.episode.update.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.admin.episode.list.queryKey() }),
  });
  const del = useMutation({
    ...trpc.admin.episode.delete.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.admin.episode.list.queryKey() }),
  });
  const enqueue = useMutation({
    ...trpc.admin.episode.enqueueTranscode.mutationOptions(),
    onSuccess: () => {
      toast.success("已入队转码");
      qc.invalidateQueries({ queryKey: trpc.admin.episode.list.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  const nextIndex = (list.data?.length ?? 0) + 1;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">集数管理</h2>
          <Button
            size="sm"
            onClick={() =>
              create.mutate({
                dramaId,
                index: nextIndex,
                title: `第 ${nextIndex} 集`,
                isFree: nextIndex <= freeEpisodes,
              })
            }
          >
            添加第 {nextIndex} 集
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">序号</th>
                <th className="px-3 py-2 text-left">标题</th>
                <th className="px-3 py-2 text-left">状态</th>
                <th className="px-3 py-2 text-left">免费</th>
                <th className="px-3 py-2 text-left">视频源</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.map((ep) => (
                <tr key={ep.id} className="border-t">
                  <td className="px-3 py-2">{ep.index}</td>
                  <td className="px-3 py-2">
                    <Input
                      defaultValue={ep.title}
                      className="h-8"
                      onBlur={(e) => {
                        if (e.target.value !== ep.title)
                          update.mutate({ id: ep.id, title: e.target.value });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={ep.status === "READY" ? "default" : "secondary"}>{ep.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={ep.isFree}
                      onCheckedChange={(v) => update.mutate({ id: ep.id, isFree: v })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <UploadButton episodeId={ep.id} onDone={(key) => enqueue.mutate({ episodeId: ep.id, inputKey: key })} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`删除第 ${ep.index} 集？`)) del.mutate({ id: ep.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {list.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    还没有集数
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadButton({ episodeId, onDone }: { episodeId: string; onDone: (key: string) => void }) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("上传失败");
      const data = (await res.json()) as { key: string };
      onDone(data.key);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
        <Upload className="mr-1 h-3.5 w-3.5" />
        {busy ? "上传中..." : "上传源文件"}
      </Button>
    </>
  );
}
