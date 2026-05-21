// GET /api/links/export-all — downloads all of the user's links as CSV.

import { NextResponse } from "next/server";
import { Url } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { getClickCounts } from "@/lib/stats-queries";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";

const HEADER = [
  "id",
  "originalUrl",
  "title",
  "tags",
  "clicks",
  "createdAt",
  "expiresAt",
  "disabled",
];

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const links = await Url.findAll({
    where: { userId, deletedAt: null },
    order: [["creationDate", "DESC"]],
    raw: true,
  });
  const clickCounts = await getClickCounts(links.map((link) => link.id));

  const rows = links.map((link) => [
    link.id,
    link.originalUrl,
    link.title,
    link.tags,
    clickCounts.get(link.id) ?? 0,
    new Date(link.creationDate).toISOString(),
    link.expirationDate ? new Date(link.expirationDate).toISOString() : "",
    link.disabled ? "yes" : "no",
  ]);

  return new NextResponse(toCsv(HEADER, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cortala-links.csv"',
    },
  });
}
