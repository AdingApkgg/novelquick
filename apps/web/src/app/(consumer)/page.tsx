import { VerticalFeed } from "@/components/feed/vertical-feed";

export default function HomePage() {
  return (
    <div className="-mb-14">
      <TopTabs />
      <VerticalFeed />
    </div>
  );
}

function TopTabs() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center gap-6 pt-[calc(env(safe-area-inset-top)+12px)] text-sm font-semibold">
      <span className="pointer-events-auto rounded-full bg-black/20 px-3 py-1 text-white/60 backdrop-blur-sm">
        关注
      </span>
      <span className="pointer-events-auto rounded-full bg-white/10 px-3 py-1 text-white text-shadow-strong backdrop-blur-sm">
        推荐
      </span>
      <span className="pointer-events-auto rounded-full bg-black/20 px-3 py-1 text-white/60 backdrop-blur-sm">
        分类
      </span>
    </div>
  );
}
