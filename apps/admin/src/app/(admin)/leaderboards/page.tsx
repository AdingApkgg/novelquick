"use client";

import { useTRPC } from "@/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@nq/ui";
import { LEADERBOARD_KEYS } from "@nq/shared/constants";
import { toast } from "sonner";

const KEYS = [
  { key: LEADERBOARD_KEYS.HOT, name: "热播榜" },
  { key: LEADERBOARD_KEYS.NEW, name: "新剧榜" },
  { key: LEADERBOARD_KEYS.FOLLOW, name: "追剧榜" },
  { key: LEADERBOARD_KEYS.VIP, name: "VIP 专区" },
];

export default function LeaderboardsPage() {
  const trpc = useTRPC();
  const rebuild = useMutation({
    ...trpc.admin.feed.rebuildLeaderboard.mutationOptions(),
    onSuccess: (r) => toast.success(`已刷新 ${r.count ?? 0} 条`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">榜单</h1>
      <p className="text-sm text-muted-foreground">点击对应按钮按当前算法重建榜单</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {KEYS.map((k) => (
          <Card key={k.key}>
            <CardHeader>
              <CardTitle className="text-base">{k.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                onClick={() => rebuild.mutate({ key: k.key, limit: 50 })}
                disabled={rebuild.isPending}
              >
                重建榜单
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
