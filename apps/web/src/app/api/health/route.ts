import { NextResponse } from "next/server";
import { prisma } from "@nq/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbError = (e as Error).message;
  }
  return NextResponse.json(
    {
      ok: dbOk,
      service: "web",
      version: process.env.npm_package_version ?? "0.1.0",
      uptimeSec: Math.round(process.uptime()),
      latencyMs: Date.now() - started,
      checks: {
        database: { ok: dbOk, error: dbError },
      },
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 },
  );
}
