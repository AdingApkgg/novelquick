"use client";

import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from "@nq/ui";
import { Coins, Crown, Settings, History, Heart, ShoppingBag, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ROUTES } from "@nq/shared/constants";

export default function MePage() {
  const trpc = useTRPC();
  const session = useSession();
  const router = useRouter();
  const me = useQuery(trpc.me.whoami.queryOptions());
  const data = me.data;

  if (!session.data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white">
        <p className="text-sm text-white/60">登录后查看个人中心</p>
        <Link href={ROUTES.signIn} className="rounded-full bg-primary px-5 py-2 text-sm">
          登录 / 注册
        </Link>
      </div>
    );
  }

  const vipActive = data?.vipUntil && new Date(data.vipUntil).getTime() > Date.now();

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20">
      <div className="flex items-center gap-3">
        <Avatar className="h-16 w-16">
          <AvatarImage src={data?.image ?? undefined} />
          <AvatarFallback>{(data?.displayName ?? data?.name ?? "U").slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-lg font-semibold">{data?.displayName ?? data?.name ?? data?.email}</p>
          <p className="text-xs text-white/50">{data?.email}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href={ROUTES.vip}
          className="rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 p-4 text-black shadow-lg"
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            <Crown className="h-4 w-4" /> VIP
          </div>
          <p className="mt-2 text-xs">
            {vipActive
              ? `有效期至 ${new Date(data!.vipUntil!).toLocaleDateString("zh-CN")}`
              : "开通会员，全集免费看"}
          </p>
        </Link>
        <Link href={ROUTES.coin} className="rounded-2xl bg-card p-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Coins className="h-4 w-4 text-amber-400" /> 金币
          </div>
          <p className="mt-2 text-xl font-bold">{data?.coinBalance ?? 0}</p>
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-white/5 rounded-2xl bg-card/50">
        <Item href={ROUTES.history} icon={<History className="h-5 w-5" />} label="观看历史" />
        <Item href={ROUTES.follow} icon={<Heart className="h-5 w-5" />} label="追剧 / 收藏" />
        <Item href="/me/orders" icon={<ShoppingBag className="h-5 w-5" />} label="我的订单" />
        <Item href="/me/settings" icon={<Settings className="h-5 w-5" />} label="设置" />
      </ul>

      <Button
        variant="ghost"
        className="mt-4 w-full text-white/70"
        onClick={async () => {
          await signOut();
          router.refresh();
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> 退出登录
      </Button>
    </div>
  );
}

function Item({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between p-4 text-sm">
        <span className="flex items-center gap-3">
          <span className="text-white/70">{icon}</span>
          {label}
        </span>
        <span className="text-white/30">›</span>
      </Link>
    </li>
  );
}
