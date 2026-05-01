"use client";

import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Button } from "@nq/ui";
import { ROUTES } from "@nq/shared/constants";
import { toast } from "sonner";

export default function HistoryPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const history = useQuery(trpc.history.list.queryOptions({ limit: 50 }));
  const clear = useMutation({
    ...trpc.history.clearAll.mutationOptions(),
    onSuccess: () => {
      toast.success("已清空");
      qc.invalidateQueries({ queryKey: trpc.history.list.queryKey() });
    },
  });

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">观看历史</h1>
        <Button size="sm" variant="ghost" onClick={() => clear.mutate()}>
          清空
        </Button>
      </div>
      <div className="space-y-3">
        {history.isPending && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {history.data?.items.map((h) => (
          <Link
            key={h.id}
            href={ROUTES.watch(h.dramaId, h.episode.index)}
            className="flex gap-3 rounded-xl bg-white/5 p-2.5"
          >
            <div className="relative aspect-[3/4] w-16 overflow-hidden rounded-md">
              {h.drama.cover && <img src={h.drama.cover} className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{h.drama.title}</p>
              <p className="mt-1 text-xs text-white/50">
                看到第 {h.episode.index} 集 / 共 {h.drama.totalEpisodes} 集
              </p>
              <p className="mt-0.5 text-xs text-white/40">
                {new Date(h.lastWatchAt).toLocaleString("zh-CN")}
              </p>
            </div>
          </Link>
        ))}
        {history.data && history.data.items.length === 0 && (
          <p className="py-12 text-center text-sm text-white/40">还没有观看历史</p>
        )}
      </div>
    </div>
  );
}
