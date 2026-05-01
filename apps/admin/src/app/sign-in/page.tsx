"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@nq/ui";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

export default function AdminSignIn() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>短剧速看 · 后台</CardTitle>
          <CardDescription>请使用管理员账号登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const r = await signIn.email({ email, password });
              setLoading(false);
              if (r.error) toast.error(r.error.message ?? "登录失败");
              else router.push("/");
            }}
          >
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
