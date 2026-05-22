// GET /api/stats — public, aggregate vanity stats for the landing page.

import { NextResponse } from "next/server";
import { Url, Click } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [links, clicks] = await Promise.all([
    Url.count({ where: { deletedAt: null } }),
    Click.count(),
  ]);

  return NextResponse.json(
    { links, clicks },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
