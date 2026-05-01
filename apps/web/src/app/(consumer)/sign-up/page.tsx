"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, Label } from "@nq/ui";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  return (
    <form
      className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-white"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const r = await signUp.email({ email, password, name });
        setLoading(false);
        if (r.error) toast.error(r.error.message ?? "注册失败");
        else router.push("/");
      }}
    >
      <h1 className="mb-2 text-2xl font-bold">创建账号</h1>
      <p className="mb-6 text-sm text-white/60">注册即送 50 金币</p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">昵称</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="mt-6 w-full">
        {loading ? "注册中..." : "注册"}
      </Button>

      <p className="mt-4 text-center text-sm text-white/60">
        已有账号？{" "}
        <Link href="/sign-in" className="text-primary">
          去登录
        </Link>
      </p>
    </form>
  );
}
