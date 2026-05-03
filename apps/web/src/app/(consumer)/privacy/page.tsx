import { SiteFooter } from "@/components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "隐私政策" };

export default function PrivacyPage() {
  return (
    <>
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <Link href="/me" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60">
          <ArrowLeft className="h-4 w-4" /> 返回
        </Link>
        <h1 className="text-2xl font-bold">隐私政策</h1>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/80">
          <p>本应用尊重并保护所有使用本服务用户的个人隐私权。</p>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">我们收集的信息</h2>
            <ul className="ml-4 list-disc space-y-1 text-white/70">
              <li>注册信息（邮箱、昵称、头像）</li>
              <li>观看记录（用于继续观看、推荐）</li>
              <li>互动数据（点赞、收藏、评论、弹幕）</li>
              <li>设备 IP（用于安全防护、限流）</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">信息的使用</h2>
            <p>我们仅将上述信息用于提供和改进服务，不会出售或租赁给第三方。</p>
          </section>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">信息的安全</h2>
            <p>密码采用单向加密存储，传输全程 HTTPS，定期审计访问日志。</p>
          </section>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">您的权利</h2>
            <p>
              您可以随时通过<Link href="/me/feedback" className="text-primary">意见反馈</Link>申请：
              查询、更正、删除您的个人信息，或注销账户。
            </p>
          </section>

          <p className="mt-6 text-xs text-white/40">最后更新：2026 年 5 月</p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
