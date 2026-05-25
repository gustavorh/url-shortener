// Lightweight, session-authenticated link search used by the in-app
// command palette. Returns the minimal fields needed to render a row
// (id, shortUrl, originalUrl, title) — the palette does its own
// filtering client-side, so this is essentially a "give me my last N
// links" endpoint. Capped to 200 to keep the payload small.

import { NextRequest, NextResponse } from "next/server";
import { Url } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { buildShortUrl } from "@/lib/short-url";

export const runtime = "nodejs";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Math.min(
    Math.max(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const rows = await Url.findAll({
    where: { userId, deletedAt: null },
    order: [["creationDate", "DESC"]],
    limit,
    attributes: ["id", "originalUrl", "title", "disabled"],
    raw: true,
  });

  return NextResponse.json({
    links: rows.map((row) => ({
      id: row.id,
      shortUrl: buildShortUrl(request, row.id),
      originalUrl: row.originalUrl,
      title: row.title ?? null,
      disabled: !!row.disabled,
    })),
  });
}
