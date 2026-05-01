"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Switch, Tabs, TabsList, TabsTrigger, TabsContent } from "@nq/ui";
import { toast } from "sonner";
import { slugify } from "@nq/shared/utils";

export default function MonetizationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">VIP / 金币</h1>
      <Tabs defaultValue="vip">
        <TabsList>
          <TabsTrigger value="vip">VIP 套餐</TabsTrigger>
          <TabsTrigger value="coins">金币包</TabsTrigger>
          <TabsTrigger value="orders">订单</TabsTrigger>
        </TabsList>
        <TabsContent value="vip">
          <VipPlans />
        </TabsContent>
        <TabsContent value="coins">
          <CoinPacks />
        </TabsContent>
        <TabsContent value="orders">
          <Orders />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VipPlans() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const list = useQuery(trpc.admin.monetization.listVipPlans.queryOptions());
  const upsert = useMutation({
    ...trpc.admin.monetization.upsertVipPlan.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.monetization.listVipPlans.queryKey() });
    },
  });
  const [draft, setDraft] = React.useState({
    name: "",
    durationDays: 30,
    priceCents: 1900,
    bonusCoins: 100,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>VIP 套餐</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y rounded border">
          {list.data?.map((p) => (
            <li key={p.id} className="grid grid-cols-6 items-center gap-2 px-3 py-2 text-sm">
              <span className="font-medium">{p.name}</span>
              <span>{p.durationDays} 天</span>
              <span>¥{(p.priceCents / 100).toFixed(2)}</span>
              <span>赠 {p.bonusCoins} 金币</span>
              <span>{p.slug}</span>
              <Switch
                checked={p.isActive}
                onCheckedChange={(v) =>
                  upsert.mutate({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    durationDays: p.durationDays,
                    priceCents: p.priceCents,
                    bonusCoins: p.bonusCoins,
                    isActive: v,
                    sortOrder: p.sortOrder,
                  })
                }
              />
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-5 gap-2">
          <Input
            placeholder="名称"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="天数"
            value={draft.durationDays}
            onChange={(e) => setDraft({ ...draft, durationDays: Number(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="价格(分)"
            value={draft.priceCents}
            onChange={(e) => setDraft({ ...draft, priceCents: Number(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="赠金币"
            value={draft.bonusCoins}
            onChange={(e) => setDraft({ ...draft, bonusCoins: Number(e.target.value) })}
          />
          <Button
            onClick={() =>
              upsert.mutate({
                slug: slugify(draft.name),
                name: draft.name,
                durationDays: draft.durationDays,
                priceCents: draft.priceCents,
                bonusCoins: draft.bonusCoins,
              })
            }
          >
            添加
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CoinPacks() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const list = useQuery(trpc.admin.monetization.listCoinPacks.queryOptions());
  const upsert = useMutation({
    ...trpc.admin.monetization.upsertCoinPack.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.monetization.listCoinPacks.queryKey() });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>金币包</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y rounded border">
          {list.data?.map((p) => (
            <li key={p.id} className="grid grid-cols-6 items-center gap-2 px-3 py-2 text-sm">
              <span className="font-medium">{p.name}</span>
              <span>{p.coins} 金币</span>
              <span>+ {p.bonusCoins}</span>
              <span>¥{(p.priceCents / 100).toFixed(2)}</span>
              <span>{p.slug}</span>
              <Switch
                checked={p.isActive}
                onCheckedChange={(v) =>
                  upsert.mutate({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    coins: p.coins,
                    bonusCoins: p.bonusCoins,
                    priceCents: p.priceCents,
                    isActive: v,
                    sortOrder: p.sortOrder,
                  })
                }
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Orders() {
  const trpc = useTRPC();
  const list = useQuery(trpc.admin.monetization.listOrders.queryOptions({ limit: 50 }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>订单</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">用户</th>
              <th className="px-3 py-2 text-left">类型</th>
              <th className="px-3 py-2 text-left">套餐</th>
              <th className="px-3 py-2 text-left">金额</th>
              <th className="px-3 py-2 text-left">状态</th>
              <th className="px-3 py-2 text-left">支付时间</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2">{o.user.email}</td>
                <td className="px-3 py-2">{o.type}</td>
                <td className="px-3 py-2">{o.vipPlan?.name ?? o.coinPack?.name ?? "—"}</td>
                <td className="px-3 py-2">¥{(o.amountCents / 100).toFixed(2)}</td>
                <td className="px-3 py-2">{o.status}</td>
                <td className="px-3 py-2">{o.paidAt ? new Date(o.paidAt).toLocaleString("zh-CN") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
