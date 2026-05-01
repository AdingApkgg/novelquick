"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import type { AppRouter } from "@nq/api";

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

let qc: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
  }
  qc ??= new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
  return qc;
}

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.NEXT_PUBLIC_ADMIN_URL) return process.env.NEXT_PUBLIC_ADMIN_URL;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = React.useState(() => {
    const { createTRPCClient } = require("@trpc/client") as typeof import("@trpc/client");
    return createTRPCClient<AppRouter>({
      links: [
        loggerLink({ enabled: () => process.env.NODE_ENV === "development" }),
        httpBatchLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
          fetch: (url, opts) => fetch(url, { ...opts, credentials: "include" }),
        }),
      ],
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
