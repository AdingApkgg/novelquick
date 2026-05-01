import { prisma } from "@nq/db/client";
import { auth } from "./auth";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth.api.getSession({ headers: opts.headers }).catch(() => null);
  return {
    prisma,
    session,
    user: session?.user ?? null,
    headers: opts.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
