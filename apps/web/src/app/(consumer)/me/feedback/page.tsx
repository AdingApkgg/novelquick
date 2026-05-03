"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Send, Bug, Lightbulb, Film, CreditCard, MessageSquare } from "lucide-react";
import { Button, Input, Label, Textarea } from "@nq/ui";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

const CATEGORIES = [
  { v: "BUG", label: "Bug 反馈", icon: Bug },
  { v: "SUGGESTION", label: "功能建议", icon: Lightbulb },
  { v: "CONTENT", label: "内容相关", icon: Film },
  { v: "PAYMENT", label: "充值订单", icon: CreditCard },
  { v: "OTHER", label: "其他", icon: MessageSquare },
] as const;

export default function FeedbackPage() {
  const trpc = useTRPC();
  const session = useSession();
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]["v"]>("SUGGESTION");
  const [content, setContent] = React.useState("");
  const [email, setEmail] = React.useState("");

  const send = useMutation({
    ...trpc.feedback.send.mutationOptions(),
    onSuccess: () => {
      toast.success("反馈已提交，谢谢！");
      setContent("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20">
      <Link href="/me" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60">
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>
      <h1 className="text-xl font-bold">意见反馈</h1>
      <p className="mt-1 text-sm text-white/50">告诉我们哪里可以做得更好</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate({
            category,
            content: content.trim(),
            email: email.trim() || undefined,
          });
        }}
      >
        <div>
          <Label>分类</Label>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const on = category === c.v;
              return (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setCategory(c.v)}
                  className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] ${
                    on ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">详细描述</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请描述你遇到的问题或建议（至少 5 个字）…"
            minLength={5}
            maxLength={2000}
            rows={6}
            required
          />
          <p className="text-right text-xs text-white/40">{content.length}/2000</p>
        </div>

        {!session.data && (
          <div className="space-y-1.5">
            <Label htmlFor="email">联系邮箱（选填）</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="你的邮箱，方便我们回复你"
            />
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={send.isPending || content.trim().length < 5}>
          <Send className="mr-1 h-4 w-4" /> {send.isPending ? "提交中…" : "提交反馈"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-white/40">
        每个用户每 10 分钟最多 5 条反馈
      </p>
    </div>
  );
}
