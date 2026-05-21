// Public REST API v1 — single link.

import { NextRequest, NextResponse } from "next/server";
import { Url } from "@/models";
import { authenticateApiKey } from "@/lib/api-auth";
import { buildShortUrl } from "@/lib/short-url";
import { getTotalClicks } from "@/lib/stats-queries";

export const runtime = "nodejs";

// GET /api/v1/links/[id] — details of one of the caller's links.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return NextResponse.json(
      { error: "API key inválida o ausente" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const link = await Url.findByPk(id, { raw: true });
  // Hide links owned by other users, and soft-deleted ones.
  if (!link || link.userId !== userId || link.deletedAt) {
    return NextResponse.json(
      { error: "Enlace no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: link.id,
    shortUrl: buildShortUrl(request, link.id),
    originalUrl: link.originalUrl,
    clicks: await getTotalClicks(link.id),
    expirationDate: link.expirationDate ?? null,
    creationDate: link.creationDate,
  });
}
