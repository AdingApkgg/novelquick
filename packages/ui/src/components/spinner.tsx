import * as React from "react";
import { cn } from "../cn";

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      {...props}
    />
  );
}
