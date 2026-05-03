"use client";

import { useEffect } from "react";
import { Button } from "@nq/ui";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <div className="rounded-full bg-red-500/15 p-4">
        <AlertTriangle className="h-9 w-9 text-red-400" />
      </div>
      <h1 className="text-xl font-bold">出错了</h1>
      <p className="max-w-sm text-sm text-white/60">
        {error.message || "页面遇到了一些问题，请稍后再试"}
      </p>
      {error.digest && <p className="text-xs text-white/30">错误 ID：{error.digest}</p>}
      <div className="mt-2 flex gap-2">
        <Button onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" /> 重试
        </Button>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-white/20 px-4 text-sm hover:bg-white/5"
        >
          <Home className="mr-1 h-4 w-4" /> 返回首页
        </Link>
      </div>
    </div>
  );
}
