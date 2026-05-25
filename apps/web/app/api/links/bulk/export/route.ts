// POST /api/links/bulk/export — returns a CSV of the caller's links by id.
// Used by the dashboard's "Exportar selección" action. The body shape
// matches the other bulk endpoints so the front-end can drive it with
// the same payload it built for delete/disable/etc.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { Url } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { getClickCounts } from "@/lib/stats-queries";
import { toCsv } from "@/lib/csv";
import { IdsBodySchema } from "@/lib/bulk-schemas";

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

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = IdsBodySchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const ids = Array.from(new Set(parsed.data.ids));
  const links = await Url.findAll({
    where: { userId, deletedAt: null, id: { [Op.in]: ids } },
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
      "Content-Disposition": `attachment; filename="cortala-links-${links.length}.csv"`,
    },
  });
}
