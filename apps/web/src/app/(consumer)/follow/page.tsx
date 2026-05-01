"use client";

import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Tabs, TabsList, TabsTrigger, TabsContent } from "@nq/ui";
import { ROUTES } from "@nq/shared/constants";
import { useSession } from "@/lib/auth-client";

export default function FollowPage() {
  const session = useSession();
  if (!session.data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white">
        <p className="text-sm text-white/60">登录后查看追剧、收藏</p>
        <Link href="/sign-in" className="rounded-full bg-primary px-5 py-2 text-sm">
          去登录
        </Link>
      </div>
    );
  }
  return <Authed />;
}

function Authed() {
  const trpc = useTRPC();
  const follows = useQuery(trpc.history.follows.queryOptions({ limit: 50 }));
  const favs = useQuery(trpc.history.favorites.queryOptions({ limit: 50 }));
  const history = useQuery(trpc.history.list.queryOptions({ limit: 50 }));

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <h1 className="mb-3 text-xl font-bold">我的追剧</h1>
      <Tabs defaultValue="follow">
        <TabsList className="bg-white/5">
          <TabsTrigger value="follow">追剧</TabsTrigger>
          <TabsTrigger value="fav">收藏</TabsTrigger>
          <TabsTrigger value="history">历史</TabsTrigger>
        </TabsList>

        <TabsContent value="follow">
          <Grid loading={follows.isPending}>
            {follows.data?.items.map((f) => <Card key={f.id} drama={f.drama} />)}
          </Grid>
        </TabsContent>
        <TabsContent value="fav">
          <Grid loading={favs.isPending}>
            {favs.data?.items.map((f) => <Card key={f.id} drama={f.drama} />)}
          </Grid>
        </TabsContent>
        <TabsContent value="history">
          <div className="grid grid-cols-3 gap-3 pb-20">
            {history.isPending && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
            {history.data?.items.map((h) => (
              <Link key={h.id} href={ROUTES.watch(h.dramaId, h.episode.index)} className="block space-y-1.5">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
                  {h.drama.cover && <img src={h.drama.cover} className="h-full w-full object-cover" />}
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[11px] text-white">
                    看到第 {h.episode.index} 集
                  </div>
                </div>
                <p className="truncate text-xs">{h.drama.title}</p>
              </Link>
            ))}
            {history.data && history.data.items.length === 0 && (
              <p className="col-span-3 py-12 text-center text-sm text-white/40">还没有观看历史</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Grid({ children, loading }: { children?: React.ReactNode; loading: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3 pb-20">
      {loading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
      {children}
    </div>
  );
}

function Card({ drama }: { drama: { id: string; title: string; cover: string | null; totalEpisodes: number } }) {
  return (
    <Link href={ROUTES.drama(drama.id)} className="block space-y-1.5">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
        {drama.cover && <img src={drama.cover} className="h-full w-full object-cover" />}
      </div>
      <p className="truncate text-xs">{drama.title}</p>
    </Link>
  );
}
