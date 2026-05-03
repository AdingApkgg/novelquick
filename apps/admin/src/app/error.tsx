"use client";

import { useEffect } from "react";
import { Button } from "@nq/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-red-500/15 p-4">
        <AlertTriangle className="h-9 w-9 text-red-500" />
      </div>
      <h1 className="text-xl font-bold">出错了</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
      {error.digest && <p className="text-xs text-muted-foreground">错误 ID：{error.digest}</p>}
      <Button onClick={reset}>
        <RotateCcw className="mr-1 h-4 w-4" /> 重试
      </Button>
    </div>
  );
}
