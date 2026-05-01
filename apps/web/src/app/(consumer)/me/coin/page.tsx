"use client";

import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { toast } from "sonner";

export default function CoinPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const me = useQuery(trpc.me.whoami.queryOptions());
  const packs = useQuery(trpc.billing.coinPacks.queryOptions());
  const txs = useQuery(trpc.me.coinTransactions.queryOptions());
  const buy = useMutation({
    ...trpc.billing.purchaseCoins.mutationOptions(),
    onSuccess: () => {
      toast.success("充值成功");
      qc.invalidateQueries({ queryKey: trpc.me.whoami.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.me.coinTransactions.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20">
      <h1 className="mb-3 text-xl font-bold">我的金币</h1>
      <div className="rounded-2xl bg-gradient-to-r from-amber-400/30 to-orange-600/30 p-5">
        <p className="text-xs text-white/60">余额</p>
        <p className="mt-1 flex items-center gap-2 text-3xl font-bold text-amber-300">
          <Coins className="h-6 w-6" />
          {me.data?.coinBalance ?? 0}
        </p>
      </div>

      <h2 className="mt-6 mb-3 text-base font-semibold">充值金币</h2>
      <div className="grid grid-cols-2 gap-3">
        {packs.data?.map((p) => (
          <button
            key={p.id}
            disabled={buy.isPending}
            onClick={() => buy.mutate({ coinPackId: p.id })}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left"
          >
            <p className="text-sm font-medium">{p.name}</p>
            <p className="mt-1 text-xs text-white/60">
              {p.coins} 金币 {p.bonusCoins > 0 && `+ 赠 ${p.bonusCoins}`}
            </p>
            <p className="mt-2 text-lg font-bold text-amber-300">¥{(p.priceCents / 100).toFixed(2)}</p>
          </button>
        ))}
      </div>

      <h2 className="mt-6 mb-3 text-base font-semibold">交易明细</h2>
      <ul className="divide-y divide-white/5 rounded-xl bg-card/50">
        {txs.data?.map((t) => (
          <li key={t.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p>{t.note ?? t.reason}</p>
              <p className="text-xs text-white/40">{new Date(t.createdAt).toLocaleString("zh-CN")}</p>
            </div>
            <span className={t.delta > 0 ? "text-emerald-400" : "text-red-400"}>
              {t.delta > 0 ? "+" : ""}
              {t.delta}
            </span>
          </li>
        ))}
        {txs.data && txs.data.length === 0 && (
          <li className="p-6 text-center text-sm text-white/40">暂无交易记录</li>
        )}
      </ul>
    </div>
  );
}
