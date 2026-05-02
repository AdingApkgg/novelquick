"use client";

import * as React from "react";
import { Coins, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@nq/ui";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const DAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function CheckInCard() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const status = useQuery(trpc.me.checkInStatus.queryOptions());
  const claim = useMutation({
    ...trpc.me.checkIn.mutationOptions(),
    onSuccess: (r) => {
      toast.success(`签到成功！连续 ${r.streak} 天，+${r.coins} 金币`);
      qc.invalidateQueries({ queryKey: trpc.me.checkInStatus.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.me.whoami.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  const data = status.data;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-pink-500/15 to-orange-500/15 p-4 ring-1 ring-white/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Flame className="h-4 w-4 text-orange-400" />
            每日签到
            {data && data.streak > 0 && (
              <span className="ml-1 text-xs text-orange-300">连续 {data.streak} 天</span>
            )}
          </p>
          <p className="mt-1 text-xs text-white/60">
            {data?.checkedToday
              ? "今日已签到，明天继续！"
              : `签到送 ${data?.todayReward ?? 2} 金币 · 连签可获额外奖励`}
          </p>
        </div>
        <Button
          size="sm"
          disabled={!data || data.checkedToday || claim.isPending}
          onClick={() => claim.mutate()}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
        >
          {data?.checkedToday ? (
            <>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              已签到
            </>
          ) : (
            <>
              <Coins className="mr-1 h-3.5 w-3.5" />
              签到
            </>
          )}
        </Button>
      </div>

      {data && (
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {data.next7.map((d, i) => {
            const todayLabel = i === 6 ? "今" : DAYS[(new Date(d.dateISO).getDay() + 6) % 7];
            return (
              <div
                key={d.dateISO}
                className={`flex flex-col items-center rounded-md py-1.5 text-[10px] ${
                  d.checked
                    ? "bg-orange-500/30 text-orange-200"
                    : i === 6
                      ? "border border-orange-400/40 text-white"
                      : "bg-white/5 text-white/40"
                }`}
              >
                <span>{todayLabel}</span>
                {d.checked ? <CheckCircle2 className="mt-0.5 h-3 w-3" /> : <Coins className="mt-0.5 h-3 w-3" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
