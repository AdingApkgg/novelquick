import IORedis from "ioredis";

let connection: IORedis | null = null;
function getRedis() {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return connection;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Fixed-window counter limiter. Lightweight; good enough for spam control.
 *
 *   const r = await rateLimit(`comment:${userId}`, 10, 60);
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  try {
    const r = getRedis();
    const k = `rl:${key}`;
    const count = await r.incr(k);
    if (count === 1) await r.expire(k, windowSec);
    if (count > limit) {
      const ttl = await r.ttl(k);
      return { ok: false, remaining: 0, retryAfterSec: Math.max(ttl, 1) };
    }
    return { ok: true, remaining: limit - count, retryAfterSec: 0 };
  } catch {
    // Fail-open: don't block users if Redis blips
    return { ok: true, remaining: limit, retryAfterSec: 0 };
  }
}
