import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <div className="rounded-full bg-white/10 p-4">
        <Compass className="h-9 w-9" />
      </div>
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-sm text-white/60">这里什么都没有</p>
      <div className="mt-2 flex gap-2">
        <Link href="/" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
          回到首页
        </Link>
        <Link href="/discover" className="rounded-full border border-white/20 px-5 py-2 text-sm">
          逛逛发现页
        </Link>
      </div>
    </div>
  );
}
