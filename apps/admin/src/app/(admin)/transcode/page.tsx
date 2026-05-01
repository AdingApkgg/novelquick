"use client";

import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Badge, Skeleton } from "@nq/ui";

export default function TranscodePage() {
  const trpc = useTRPC();
  const jobs = useQuery(trpc.admin.episode.jobs.queryOptions({}));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">转码任务</h1>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">任务 ID</th>
              <th className="px-4 py-3 text-left">集</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-left">进度</th>
              <th className="px-4 py-3 text-left">输出目录</th>
              <th className="px-4 py-3 text-left">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {jobs.isPending && (
              <tr>
                <td colSpan={6}>
                  <Skeleton className="h-10 w-full" />
                </td>
              </tr>
            )}
            {jobs.data?.map((j) => (
              <tr key={j.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{j.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{j.episode.title}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      j.status === "SUCCEEDED" ? "default" : j.status === "FAILED" ? "destructive" : "secondary"
                    }
                  >
                    {j.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{j.progress}%</td>
                <td className="px-4 py-3 font-mono text-xs">{j.outputDir}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(j.createdAt).toLocaleString("zh-CN")}
                </td>
              </tr>
            ))}
            {jobs.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  暂无任务
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
