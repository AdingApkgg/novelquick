"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Button } from "@nq/ui";
import { Coins, Eye } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WatchPayload } from "@nq/shared/types";

export function UnlockSheet({
  episodeId,
  drama,
}: {
  episodeId: string;
  drama: WatchPayload["drama"];
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const unlock = useMutation({
    ...trpc.billing.unlockEpisode.mutationOptions(),
    onSuccess: () => {
      toast.success("解锁成功");
      qc.invalidateQueries({ queryKey: trpc.episode.watch.queryKey() });
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>解锁本集</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-card text-foreground">
        <SheetHeader>
          <SheetTitle>解锁本集</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 p-4">
          <button
            disabled={unlock.isPending}
            onClick={() => unlock.mutate({ episodeId, source: "COINS" })}
            className="flex w-full items-center justify-between rounded-xl border border-border/30 p-4 text-left hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">金币解锁</p>
                <p className="text-xs text-muted-foreground">消耗 {drama.unlockCoins} 金币</p>
              </div>
            </div>
          </button>
          <button
            disabled={unlock.isPending}
            onClick={() => unlock.mutate({ episodeId, source: "AD" })}
            className="flex w-full items-center justify-between rounded-xl border border-border/30 p-4 text-left hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">观看广告解锁</p>
                <p className="text-xs text-muted-foreground">完整观看一段广告即可</p>
              </div>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
