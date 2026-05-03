"use client";

import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";

export function SiteFooter() {
  const trpc = useTRPC();
  const cfg = useQuery({
    ...trpc.site.config.queryOptions(),
    staleTime: 5 * 60 * 1000,
  });
  const c = cfg.data;

  return (
    <footer className="mt-12 border-t border-white/10 px-4 pb-20 pt-6 text-center text-xs text-white/40">
      <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/about" className="hover:text-white/70">关于我们</Link>
        <span className="text-white/15">·</span>
        <Link href="/help" className="hover:text-white/70">帮助中心</Link>
        <span className="text-white/15">·</span>
        <Link href="/me/feedback" className="hover:text-white/70">意见反馈</Link>
        <span className="text-white/15">·</span>
        <Link href="/terms" className="hover:text-white/70">服务条款</Link>
        <span className="text-white/15">·</span>
        <Link href="/privacy" className="hover:text-white/70">隐私政策</Link>
      </nav>
      <p>© {new Date().getFullYear()} {c?.siteName ?? "短剧速看"}</p>
      {c?.icp && (
        <p className="mt-1">
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
            {c.icp}
          </a>
        </p>
      )}
      {c?.contact && <p className="mt-1">联系：{c.contact}</p>}
    </footer>
  );
}
