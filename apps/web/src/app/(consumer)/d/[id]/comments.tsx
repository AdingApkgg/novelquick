"use client";

import * as React from "react";
import { Send, Heart, MessageCircle } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage, Button, Input, Spinner, Tabs, TabsList, TabsTrigger } from "@nq/ui";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

type Sort = "hot" | "new";

export function DramaComments({ dramaId }: { dramaId: string }) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const session = useSession();
  const [sort, setSort] = React.useState<Sort>("hot");
  const [text, setText] = React.useState("");

  const list = useInfiniteQuery(
    trpc.comment.list.infiniteQueryOptions(
      { dramaId, limit: 20, sort },
      { getNextPageParam: (l) => l.nextCursor },
    ),
  );

  const create = useMutation({
    ...trpc.comment.create.mutationOptions(),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: trpc.comment.list.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">评论 ({items.length})</h2>
        <Tabs value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <TabsList className="h-7 bg-white/5">
            <TabsTrigger value="hot" className="h-6 px-2 text-xs">
              热门
            </TabsTrigger>
            <TabsTrigger value="new" className="h-6 px-2 text-xs">
              最新
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Composer */}
      {session.data ? (
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            create.mutate({ dramaId, content: text.trim() });
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="说说你的看法…"
            maxLength={500}
            className="flex-1 bg-white/5"
          />
          <Button type="submit" size="icon" disabled={create.isPending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <p className="mt-3 rounded-md bg-white/5 px-3 py-2 text-xs text-white/50">
          <Link href="/sign-in" className="text-primary">
            登录
          </Link>{" "}
          后参与讨论
        </p>
      )}

      <div className="mt-4 divide-y divide-white/5">
        {list.isPending && (
          <div className="flex h-24 items-center justify-center">
            <Spinner />
          </div>
        )}
        {items.map((c) => (
          <CommentRow key={c.id} comment={c} />
        ))}
        {items.length === 0 && !list.isPending && (
          <p className="py-12 text-center text-sm text-white/40">暂无评论，第一个发表观点吧</p>
        )}
      </div>

      {list.hasNextPage && (
        <button
          onClick={() => list.fetchNextPage()}
          className="mt-4 w-full rounded-md bg-white/5 py-2 text-xs text-white/60"
        >
          {list.isFetchingNextPage ? "加载中…" : "加载更多"}
        </button>
      )}
    </section>
  );
}

function CommentRow({
  comment: c,
}: {
  comment: {
    id: string;
    content: string;
    likeCount: number;
    replyCount: number;
    createdAt: Date | string;
    liked: boolean;
    user: { id: string; displayName: string | null; name: string | null; image: string | null };
  };
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [likedOpt, setLikedOpt] = React.useState(c.liked);
  const [likeCntOpt, setLikeCntOpt] = React.useState(c.likeCount);

  const toggle = useMutation({
    ...trpc.comment.toggleLike.mutationOptions(),
    onError: (e) => {
      setLikedOpt((p) => !p);
      setLikeCntOpt((p) => p + (likedOpt ? 1 : -1));
      toast.error(e.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.comment.list.queryKey() }),
  });

  const click = () => {
    setLikedOpt((p) => !p);
    setLikeCntOpt((p) => p + (likedOpt ? -1 : 1));
    toggle.mutate({ commentId: c.id });
  };

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={c.user.image ?? undefined} />
        <AvatarFallback>{(c.user.displayName ?? c.user.name ?? "U").slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/50">{c.user.displayName ?? c.user.name}</p>
        <p className="mt-0.5 break-words text-sm">{c.content}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
          <span>{new Date(c.createdAt).toLocaleString("zh-CN")}</span>
          <button onClick={click} className={`flex items-center gap-1 ${likedOpt ? "text-primary" : ""}`}>
            <Heart className={`h-3 w-3 ${likedOpt ? "fill-current" : ""}`} /> {likeCntOpt}
          </button>
          {c.replyCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> {c.replyCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
