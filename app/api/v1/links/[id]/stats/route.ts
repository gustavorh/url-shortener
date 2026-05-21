// Public REST API v1 — analytics for a single link.

import { NextRequest, NextResponse } from "next/server";
import { Url } from "@/models";
import { authenticateApiKey } from "@/lib/api-auth";
import { getLinkStats } from "@/lib/stats-queries";

export const runtime = "nodejs";

// GET /api/v1/links/[id]/stats — full analytics bundle for one link.
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
  if (!link || link.userId !== userId) {
    return NextResponse.json(
      { error: "Enlace no encontrado" },
      { status: 404 }
    );
  }

  const stats = await getLinkStats(id);
  return NextResponse.json({ id, ...stats });
}
