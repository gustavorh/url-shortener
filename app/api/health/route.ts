import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";
import { isCacheEnabled, cacheGet } from "@/lib/cache";
import { APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/health — readiness probe.
// The database is required; the cache is optional and never fails health.
export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await testConnection();
    checks.database = "ok";
  } catch {
    checks.database = "error";
    healthy = false;
  }

  if (isCacheEnabled()) {
    try {
      await cacheGet("health:ping");
      checks.cache = "ok";
    } catch {
      checks.cache = "error";
    }
  } else {
    checks.cache = "disabled";
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      version: APP_VERSION,
      checks,
      uptime: Math.round(process.uptime()),
    },
    { status: healthy ? 200 : 503 }
  );
}
