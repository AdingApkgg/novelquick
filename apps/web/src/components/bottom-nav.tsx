"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, User, Search } from "lucide-react";
import { cn } from "@nq/ui/cn";

const ITEMS = [
  { href: "/", label: "推荐", icon: Home },
  { href: "/discover", label: "发现", icon: Compass },
  { href: "/search", label: "搜索", icon: Search },
  { href: "/follow", label: "追剧", icon: Heart },
  { href: "/me", label: "我的", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-white/10 bg-black/80 backdrop-blur-xl">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
              active ? "text-primary" : "text-white/60 hover:text-white",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
