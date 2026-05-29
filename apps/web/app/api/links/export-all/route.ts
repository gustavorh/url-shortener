// GET /api/links/export-all — downloads the user's links as CSV. Honors the
// same ?q= and ?tag= filters as the dashboard.

import { NextRequest, NextResponse } from "next/server";
import { Op, type WhereOptions } from "sequelize";
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

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const where: WhereOptions = { userId, deletedAt: null };

  const query = (searchParams.get("q") ?? "").trim();
  if (query) {
    const term = `%${query}%`;
    Object.assign(where, {
      [Op.or]: [
        { id: { [Op.like]: term } },
        { originalUrl: { [Op.like]: term } },
        { title: { [Op.like]: term } },
      ],
    });
  }
  const tag = (searchParams.get("tag") ?? "").trim().toLowerCase();
  if (tag) {
    Object.assign(where, { tags: { [Op.like]: `%${tag}%` } });
  }

  const links = await Url.findAll({
    where,
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
      "Content-Disposition": 'attachment; filename="linkly-links.csv"',
    },
  });
}
