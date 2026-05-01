import Link from "next/link";
import { trpcServer } from "@/lib/trpc/server";
import { ROUTES } from "@nq/shared/constants";
import { Badge } from "@nq/ui";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trpc = await trpcServer();
  const [list, cats] = await Promise.all([
    trpc.drama.list({ categorySlug: slug, sort: "weight", limit: 30 }),
    trpc.feed.categories(),
  ]);
  const cat = cats.find((c) => c.slug === slug);

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20">
      <h1 className="mb-3 text-xl font-bold">{cat?.name ?? slug}</h1>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {cats.map((c) => (
          <Link
            key={c.id}
            href={ROUTES.category(c.slug)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${c.slug === slug ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/70"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {list.items.map((d) => (
          <Link key={d.id} href={ROUTES.drama(d.id)} className="block space-y-1.5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
              {d.cover && <img src={d.cover} className="h-full w-full object-cover" />}
              {d.isVip && (
                <Badge variant="vip" className="absolute left-1.5 top-1.5 text-[10px]">
                  VIP
                </Badge>
              )}
            </div>
            <p className="truncate text-xs">{d.title}</p>
          </Link>
        ))}
        {list.items.length === 0 && (
          <p className="col-span-3 py-12 text-center text-sm text-white/40">该分类暂无内容</p>
        )}
      </div>
    </div>
  );
}
