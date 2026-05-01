import { trpcServer } from "@/lib/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@nq/ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const trpc = await trpcServer();
  const [overview, recent] = await Promise.all([trpc.admin.stats.overview(), trpc.admin.stats.recent()]);

  const tiles = [
    { label: "用户总数", value: overview.users },
    { label: "剧集总数", value: overview.dramas },
    { label: "集数总数", value: overview.episodes },
    { label: "评论总数", value: overview.comments },
    { label: "订单总数", value: overview.orders },
    { label: "总收入(元)", value: (overview.revenueCents / 100).toFixed(2) },
    { label: "近 7 天新用户", value: recent.newUsers },
    { label: "近 7 天付费", value: recent.newOrders },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">总览</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{String(t.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
