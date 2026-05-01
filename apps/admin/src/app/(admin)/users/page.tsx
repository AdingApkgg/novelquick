"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, Badge } from "@nq/ui";
import { toast } from "sonner";

export default function UsersPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const list = useInfiniteQuery(
    trpc.admin.user.list.infiniteQueryOptions({ q }, { getNextPageParam: (p) => p.nextCursor }),
  );
  const update = useMutation({
    ...trpc.admin.user.update.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.user.list.queryKey() });
    },
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">用户</h1>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索邮箱 / 昵称" className="max-w-sm" />

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">邮箱</th>
              <th className="px-3 py-2 text-left">昵称</th>
              <th className="px-3 py-2 text-left">角色</th>
              <th className="px-3 py-2 text-left">状态</th>
              <th className="px-3 py-2 text-left">VIP</th>
              <th className="px-3 py-2 text-left">金币</th>
              <th className="px-3 py-2 text-left">注册</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.displayName ?? u.name ?? "-"}</td>
                <td className="px-3 py-2">
                  <select
                    className="h-7 rounded border bg-background px-2 text-xs"
                    value={u.role}
                    onChange={(e) => update.mutate({ id: u.id, role: e.target.value as any })}
                  >
                    <option value="USER">USER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={u.status === "ACTIVE" ? "default" : "destructive"}>{u.status}</Badge>
                </td>
                <td className="px-3 py-2">
                  {u.vipUntil ? new Date(u.vipUntil).toLocaleDateString("zh-CN") : "-"}
                </td>
                <td className="px-3 py-2">{u.coinBalance}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
