import { trpcServer } from "@/lib/trpc/server";
import { SiteFooter } from "@/components/footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "关于我们" };

export default async function AboutPage() {
  const trpc = await trpcServer();
  const cfg = await trpc.site.config();

  return (
    <>
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <Link href="/me" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60">
          <ArrowLeft className="h-4 w-4" /> 返回
        </Link>
        <h1 className="text-2xl font-bold">关于 {cfg.siteName}</h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
          <p>{cfg.about}</p>
          <p>
            我们致力于打造一个干净、专注的短剧观看环境 — 沉浸式竖屏播放、智能推荐、丰富分类，
            让你的碎片时间充满乐趣。
          </p>
          <h2 className="mt-6 text-lg font-semibold text-white">技术栈</h2>
          <p>
            基于 Next.js 16 / React 19 / tRPC / Prisma / Tauri 构建，前后端全 TypeScript，
            支持 Web、Android、iOS、桌面端多平台。
          </p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
