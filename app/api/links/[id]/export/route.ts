// GET /api/links/[id]/export — downloads the link's clicks as CSV.

import { NextRequest, NextResponse } from "next/server";
import { Url, Click } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";

const HEADER = [
  "timestamp",
  "country",
  "device",
  "browser",
  "os",
  "referrer",
  "targetUrl",
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const link = await Url.findByPk(id, { raw: true });
  if (!link || link.userId !== userId || link.deletedAt) {
    return NextResponse.json(
      { error: "Enlace no encontrado" },
      { status: 404 }
    );
  }

  const clicks = await Click.findAll({
    where: { urlId: id },
    order: [["timestamp", "ASC"]],
    raw: true,
  });

  const rows = clicks.map((click) => [
    new Date(click.timestamp).toISOString(),
    click.country,
    click.deviceType,
    click.browser,
    click.os,
    click.referrer,
    click.targetUrl,
  ]);

  return new NextResponse(toCsv(HEADER, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clicks-${id}.csv"`,
    },
  });
}
