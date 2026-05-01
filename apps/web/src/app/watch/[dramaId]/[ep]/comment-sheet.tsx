"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Input, Button, Avatar, AvatarFallback, AvatarImage, Spinner } from "@nq/ui";
import { Send } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function CommentSheet({
  dramaId,
  episodeId,
  children,
}: {
  dramaId: string;
  episodeId: string;
  children: React.ReactNode;
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [text, setText] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const list = useInfiniteQuery(
    trpc.comment.list.infiniteQueryOptions(
      { episodeId, limit: 20 },
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="flex h-[70vh] flex-col bg-card text-foreground">
        <SheetHeader>
          <SheetTitle>评论 ({items.length})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {list.isPending && (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          )}
          {items.map((c) => (
            <div key={c.id} className="flex gap-3 py-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.user.image ?? undefined} />
                <AvatarFallback>{(c.user.displayName ?? c.user.name ?? "U").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{c.user.displayName ?? c.user.name}</p>
                <p className="mt-0.5 text-sm">{c.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString("zh-CN")}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && !list.isPending && (
            <p className="py-12 text-center text-sm text-muted-foreground">第一个评论评论这个剧吧</p>
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-border/30 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            create.mutate({ dramaId, episodeId, content: text.trim() });
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你的看法..."
            maxLength={500}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={create.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
