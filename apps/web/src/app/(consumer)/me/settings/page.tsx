"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, LogOut, Shield, Bell, Palette, Trash2 } from "lucide-react";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Switch } from "@nq/ui";
import { useSession, signOut, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const session = useSession();
  const router = useRouter();
  const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = React.useState(false);
  const [signOutBusy, setSignOutBusy] = React.useState(false);

  const [autoplay, setAutoplay] = React.useState(true);
  const [danmakuOn, setDanmakuOn] = React.useState(true);

  React.useEffect(() => {
    try {
      setAutoplay(localStorage.getItem("nq_autoplay") !== "0");
      setDanmakuOn(localStorage.getItem("nq_danmaku") !== "0");
    } catch {}
  }, []);

  if (!session.data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white">
        <p className="text-sm text-white/60">请先登录</p>
        <Link href="/sign-in" className="rounded-full bg-primary px-5 py-2 text-sm">
          去登录
        </Link>
      </div>
    );
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error("两次输入的新密码不一致");
    if (pw.next.length < 6) return toast.error("新密码至少 6 位");
    setPwBusy(true);
    try {
      const r = await authClient.changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      if (r.error) throw new Error(r.error.message ?? "修改失败");
      setPw({ current: "", next: "", confirm: "" });
      toast.success("密码已更新");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPwBusy(false);
    }
  };

  const signOutAll = async () => {
    setSignOutBusy(true);
    try {
      // Better-auth: revoke all other sessions then sign out current
      await authClient.revokeOtherSessions?.().catch(() => {});
      await signOut();
      router.push("/");
    } finally {
      setSignOutBusy(false);
    }
  };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20">
      <Link href="/me" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60">
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>
      <h1 className="text-xl font-bold">设置</h1>

      <Card className="mt-5 border-white/5 bg-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> 外观
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <Row label="主题">
            <ThemeToggle />
          </Row>
          <Row label="评论页连续播放">
            <Switch
              checked={autoplay}
              onCheckedChange={(v) => {
                setAutoplay(v);
                try {
                  localStorage.setItem("nq_autoplay", v ? "1" : "0");
                } catch {}
              }}
            />
          </Row>
          <Row label="弹幕默认开启">
            <Switch
              checked={danmakuOn}
              onCheckedChange={(v) => {
                setDanmakuOn(v);
                try {
                  localStorage.setItem("nq_danmaku", v ? "1" : "0");
                } catch {}
              }}
            />
          </Row>
        </CardContent>
      </Card>

      <Card className="mt-4 border-white/5 bg-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" /> 修改密码
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cur">当前密码</Label>
              <Input
                id="cur"
                type="password"
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">新密码</Label>
              <Input
                id="next"
                type="password"
                minLength={6}
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf">确认新密码</Label>
              <Input
                id="cf"
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={pwBusy} className="w-full">
              {pwBusy ? "保存中…" : "更新密码"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 border-white/5 bg-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> 安全
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={signOutBusy}
            onClick={signOutAll}
          >
            <LogOut className="mr-2 h-4 w-4" /> 退出所有设备
          </Button>
          <p className="text-xs text-white/40">将注销当前账号在所有设备的登录状态</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}
