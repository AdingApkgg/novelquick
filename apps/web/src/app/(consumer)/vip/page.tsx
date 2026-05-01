"use client";

import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Check } from "lucide-react";
import { toast } from "sonner";

export default function VipPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const plans = useQuery(trpc.billing.vipPlans.queryOptions());
  const me = useQuery(trpc.me.whoami.queryOptions());
  const purchase = useMutation({
    ...trpc.billing.purchaseVip.mutationOptions(),
    onSuccess: () => {
      toast.success("会员开通成功");
      qc.invalidateQueries({ queryKey: trpc.me.whoami.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  const vipUntil = me.data?.vipUntil;
  const active = vipUntil && new Date(vipUntil).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900/40 via-black to-black px-4 pt-[calc(env(safe-area-inset-top)+24px)] pb-20">
      <div className="rounded-3xl bg-gradient-to-br from-amber-300 to-orange-500 p-6 text-black shadow-2xl">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Crown /> 短剧速看 VIP
        </div>
        <p className="mt-2 text-sm">全集免费 · 无广告 · 高清画质 · 专属角标</p>
        {active && (
          <p className="mt-3 text-xs">已开通 · 有效期至 {new Date(vipUntil!).toLocaleDateString("zh-CN")}</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {plans.data?.map((p) => (
          <button
            key={p.id}
            disabled={purchase.isPending}
            onClick={() => purchase.mutate({ vipPlanId: p.id })}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-center"
          >
            <p className="text-sm font-medium">{p.name}</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">¥{(p.priceCents / 100).toFixed(0)}</p>
            <p className="mt-1 text-[11px] text-white/60">
              {p.bonusCoins > 0 ? `赠 ${p.bonusCoins} 金币` : `${p.durationDays} 天`}
            </p>
          </button>
        ))}
      </div>

      <ul className="mt-8 space-y-3 text-sm text-white/80">
        <Benefit text="海量短剧全集免费观看" />
        <Benefit text="去除广告 · 极速播放" />
        <Benefit text="VIP 专属高分剧集" />
        <Benefit text="弹幕专属字色 · 专属头像挂件" />
      </ul>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 text-amber-400" /> {text}
    </li>
  );
}
