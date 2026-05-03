import { NextResponse } from "next/server";
import { prisma } from "@nq/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  return NextResponse.json(
    { ok: dbOk, service: "admin", uptimeSec: Math.round(process.uptime()) },
    { status: dbOk ? 200 : 503 },
  );
}
