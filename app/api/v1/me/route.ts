// Public REST API v1 — the authenticated account.

import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models";
import { authenticateApiKey } from "@/lib/api-auth";
import { getUserTotals } from "@/lib/stats-queries";

export const runtime = "nodejs";

// GET /api/v1/me — account info and totals for the API key's owner.
export async function GET(request: NextRequest) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return NextResponse.json(
      { error: "API key inválida o ausente" },
      { status: 401 }
    );
  }

  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "name", "username", "createdAt"],
    raw: true,
  });
  const totals = await getUserTotals(userId);

  return NextResponse.json({
    id: user?.id,
    email: user?.email,
    name: user?.name ?? null,
    username: user?.username ?? null,
    createdAt: user?.createdAt,
    links: totals.links,
    clicks: totals.clicks,
  });
}
