import { SiteFooter } from "@/components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "帮助中心" };

const FAQ = [
  {
    q: "如何观看 VIP 短剧？",
    a: "在剧集详情页点击「开通 VIP」，选择套餐购买后即可全集免费观看。也可以使用金币单独解锁某一集，或观看广告解锁。",
  },
  {
    q: "金币如何获得？",
    a: "每日签到（连签获更多）、邀请好友、完成任务、充值购买。",
  },
  {
    q: "看不到视频怎么办？",
    a: "请检查网络连接。如仍有问题，可在「我的-意见反馈」提交问题，我们会尽快处理。",
  },
  {
    q: "弹幕怎么发送？",
    a: "目前弹幕在播放页可见，发送功能即将上线。",
  },
  {
    q: "如何切换播放速度？",
    a: "在播放页右侧点击「速度」按钮，可在 0.75× 到 2× 间切换。",
  },
  {
    q: "支持哪些设备？",
    a: "Web（PC + 移动浏览器）、Android、iOS、Windows、macOS、Linux 桌面客户端。",
  },
  {
    q: "如何注销账号？",
    a: "请通过「意见反馈」提交注销申请，我们会在 7 个工作日内核实并删除您的数据。",
  },
];

export default function HelpPage() {
  return (
    <>
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <Link href="/me" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60">
          <ArrowLeft className="h-4 w-4" /> 返回
        </Link>
        <h1 className="text-2xl font-bold">帮助中心</h1>
        <p className="mt-2 text-sm text-white/50">常见问题</p>
        <div className="mt-4 space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl bg-white/5 p-4 open:bg-white/10"
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                <span>{item.q}</span>
                <span className="text-white/40 transition group-open:rotate-180">⌃</span>
              </summary>
              <p className="mt-2 text-sm text-white/70">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-white/5 p-4 text-center text-sm">
          没有找到答案？
          <Link href="/me/feedback" className="ml-1 text-primary">
            提交反馈 →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
