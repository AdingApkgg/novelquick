import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";
import { rateLimit } from "./rate-limit";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user, session: ctx.session! } });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  const role = (ctx.user as { role?: string } | null)?.role;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "EDITOR") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user: ctx.user, session: ctx.session! } });
});

const isSuperAdmin = t.middleware(({ ctx, next }) => {
  const role = (ctx.user as { role?: string } | null)?.role;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (role !== "SUPERADMIN") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user: ctx.user, session: ctx.session! } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
export const superAdminProcedure = t.procedure.use(isSuperAdmin);

/**
 * Wrap a procedure to apply a per-user rate limit (fixed window).
 *   rateLimited(protectedProcedure, { name: "comment", limit: 10, windowSec: 60 })
 */
export function rateLimited<TBuilder extends typeof publicProcedure>(
  procedure: TBuilder,
  opts: { name: string; limit: number; windowSec: number },
): TBuilder {
  return procedure.use(async ({ ctx, next }) => {
    const subject = ctx.user?.id ?? ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const r = await rateLimit(`${opts.name}:${subject}`, opts.limit, opts.windowSec);
    if (!r.ok) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `操作太频繁，请 ${r.retryAfterSec}s 后重试`,
      });
    }
    return next();
  }) as TBuilder;
}
