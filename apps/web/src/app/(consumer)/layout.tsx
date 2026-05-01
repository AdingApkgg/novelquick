import { BottomNav } from "@/components/bottom-nav";

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100svh] bg-black text-white">
      <main className="pb-14">{children}</main>
      <BottomNav />
    </div>
  );
}
