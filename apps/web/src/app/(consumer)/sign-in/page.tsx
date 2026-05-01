"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, Label } from "@nq/ui";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  return (
    <form
      className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-white"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const r = await signIn.email({ email, password });
        setLoading(false);
        if (r.error) toast.error(r.error.message ?? "登录失败");
        else router.push("/");
      }}
    >
      <h1 className="mb-2 text-2xl font-bold">欢迎回来</h1>
      <p className="mb-6 text-sm text-white/60">登录账号继续观看精彩短剧</p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="mt-6 w-full">
        {loading ? "登录中..." : "登录"}
      </Button>

      <p className="mt-4 text-center text-sm text-white/60">
        还没有账号？{" "}
        <Link href="/sign-up" className="text-primary">
          立即注册
        </Link>
      </p>
    </form>
  );
}
