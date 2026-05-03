import { SiteFooter } from "@/components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "服务条款" };

export default function TermsPage() {
  return (
    <>
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <Link href="/me" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60">
          <ArrowLeft className="h-4 w-4" /> 返回
        </Link>
        <h1 className="text-2xl font-bold">服务条款</h1>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/80">
          <p>欢迎使用本服务。使用本应用即表示您同意以下条款。</p>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">一、账号</h2>
            <p>您应妥善保管账号密码，对账号下产生的全部行为负责。请勿出借、转让账号。</p>
          </section>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">二、内容</h2>
            <p>禁止发布违法、暴力、色情、侵权等内容。违者可能被警告、封禁。</p>
          </section>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">三、付费</h2>
            <p>VIP 与金币购买后不可退款，但您可以在剩余有效期内享受相应权益。</p>
          </section>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">四、知识产权</h2>
            <p>平台内容受版权保护。未经授权不得下载、二次传播。</p>
          </section>

          <section>
            <h2 className="mt-4 text-base font-semibold text-white">五、免责</h2>
            <p>因不可抗力、网络故障、第三方原因导致的服务中断，平台不承担责任。</p>
          </section>

          <p className="mt-6 text-xs text-white/40">最后更新：2026 年 5 月</p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
