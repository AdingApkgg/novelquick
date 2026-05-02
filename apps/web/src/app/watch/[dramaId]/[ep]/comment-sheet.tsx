"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Input,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@nq/ui";
import { Send, Heart, MessageCircle } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Sort = "hot" | "new";

export function CommentSheet({
  dramaId,
  episodeId,
  children,
}: {
  dramaId: string;
  episodeId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="flex h-[75vh] flex-col bg-card text-foreground">
        <Inner dramaId={dramaId} episodeId={episodeId} />
      </SheetContent>
    </Sheet>
  );
}

function Inner({ dramaId, episodeId }: { dramaId: string; episodeId: string }) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [sort, setSort] = React.useState<Sort>("hot");
  const [text, setText] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<{ id: string; name: string } | null>(null);

  const list = useInfiniteQuery(
    trpc.comment.list.infiniteQueryOptions(
      { episodeId, limit: 20, sort },
      { getNextPageParam: (l) => l.nextCursor },
    ),
  );

  const create = useMutation({
    ...trpc.comment.create.mutationOptions(),
    onSuccess: () => {
      setText("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: trpc.comment.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.comment.replies.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <SheetHeader className="border-b border-border/30">
        <SheetTitle>评论 {items.length > 0 && `(${items.length})`}</SheetTitle>
        <Tabs value={sort} onValueChange={(v) => setSort(v as Sort)} className="mt-2">
          <TabsList className="h-8 bg-muted/40">
            <TabsTrigger value="hot" className="h-7 px-3 text-xs">
              热门
            </TabsTrigger>
            <TabsTrigger value="new" className="h-7 px-3 text-xs">
              最新
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {list.isPending && (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        )}
        {items.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            onReply={() => setReplyTo({ id: c.id, name: c.user.displayName ?? c.user.name ?? "用户" })}
          />
        ))}
        {items.length === 0 && !list.isPending && (
          <p className="py-12 text-center text-sm text-muted-foreground">第一个评论这部剧吧</p>
        )}
      </div>

      <form
        className="flex flex-col gap-2 border-t border-border/30 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          create.mutate({
            dramaId,
            episodeId,
            content: text.trim(),
            parentId: replyTo?.id,
          });
        }}
      >
        {replyTo && (
          <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
            <span>回复 @{replyTo.name}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-muted-foreground/70 hover:text-foreground">
              取消
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? `回复 @${replyTo.name}…` : "写下你的看法…"}
            maxLength={500}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={create.isPending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </>
  );
}

function CommentItem({
  comment: c,
  onReply,
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
  onReply: () => void;
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [likedOpt, setLikedOpt] = React.useState(c.liked);
  const [likeCntOpt, setLikeCntOpt] = React.useState(c.likeCount);
  const [showReplies, setShowReplies] = React.useState(false);

  const toggle = useMutation({
    ...trpc.comment.toggleLike.mutationOptions(),
    onError: (e) => {
      // rollback
      setLikedOpt((p) => !p);
      setLikeCntOpt((p) => p + (likedOpt ? 1 : -1));
      toast.error(e.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.comment.list.queryKey() }),
  });

  const handleLikeClick = () => {
    // optimistic flip first, then fire — onMutate has tricky generics with tRPC
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
        <p className="text-xs text-muted-foreground">{c.user.displayName ?? c.user.name}</p>
        <p className="mt-0.5 break-words text-sm">{c.content}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{new Date(c.createdAt).toLocaleString("zh-CN")}</span>
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1 ${likedOpt ? "text-primary" : ""}`}
          >
            <Heart className={`h-3.5 w-3.5 ${likedOpt ? "fill-current" : ""}`} /> {likeCntOpt}
          </button>
          <button onClick={onReply} className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> 回复
          </button>
          {c.replyCount > 0 && (
            <button onClick={() => setShowReplies((s) => !s)} className="text-primary">
              {showReplies ? "收起" : `查看 ${c.replyCount} 条回复`}
            </button>
          )}
        </div>
        {showReplies && <RepliesList parentId={c.id} />}
      </div>
    </div>
  );
}

function RepliesList({ parentId }: { parentId: string }) {
  const trpc = useTRPC();
  const replies = useQuery(trpc.comment.replies.queryOptions({ parentId, limit: 30 }));

  if (replies.isPending) return <div className="py-2 pl-2 text-xs text-muted-foreground">加载中…</div>;
  if (!replies.data?.items.length) return null;

  return (
    <div className="mt-2 space-y-2 rounded-md bg-muted/30 p-2">
      {replies.data.items.map((r) => (
        <div key={r.id} className="flex gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={r.user.image ?? undefined} />
            <AvatarFallback className="text-xs">{(r.user.displayName ?? r.user.name ?? "U").slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{r.user.displayName ?? r.user.name}</p>
            <p className="break-words text-sm">{r.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
