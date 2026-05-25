import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/health/live — liveness probe. Checks no dependencies: a 200 here
// means the process is up. Use /api/health for readiness (DB + cache).
export function GET() {
  return NextResponse.json({ status: "ok", uptime: Math.round(process.uptime()) });
}
