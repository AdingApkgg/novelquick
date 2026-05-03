"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Tags,
  ListOrdered,
  Users,
  MessageSquare,
  Layers,
  CreditCard,
  Sparkles,
  Settings,
  LogOut,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { cn } from "@nq/ui/cn";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/dramas", label: "剧集管理", icon: Film },
  { href: "/transcode", label: "转码任务", icon: Sparkles },
  { href: "/taxonomy", label: "分类 / 标签", icon: Tags },
  { href: "/feed", label: "推荐位", icon: Layers },
  { href: "/leaderboards", label: "榜单", icon: ListOrdered },
  { href: "/comments", label: "评论审核", icon: MessageSquare },
  { href: "/users", label: "用户", icon: Users },
  { href: "/monetization", label: "VIP / 金币", icon: CreditCard },
  { href: "/feedback", label: "意见反馈", icon: Inbox },
  { href: "/audit", label: "操作日志", icon: ShieldCheck },
  { href: "/settings", label: "站点设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="px-5 py-6">
        <p className="text-lg font-bold tracking-tight">短剧速看</p>
        <p className="text-xs text-muted-foreground">运营后台</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
        onClick={async () => {
          await signOut();
          router.push("/sign-in");
        }}
      >
        <LogOut className="h-4 w-4" /> 退出
      </button>
    </aside>
  );
}
