// POST /api/links/bulk/tag — adds or removes a tag across many links.
//
// Body: { ids: string[], tag: string, action: "add" | "remove" }
//
// `add` appends the tag iff it isn't already present (so the cap of
// MAX_TAGS in lib/tags.ts is respected per row). `remove` strips it
// from every selected link. Per-row work means we can't use a single
// SQL update, but at MAX_BULK_IDS = 500 the loop stays well under a
// second on local MySQL.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Op } from "sequelize";
import { Url } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { parseTags, serializeTags, splitTags } from "@/lib/tags";
import { MAX_BULK_IDS } from "@/lib/bulk-schemas";

export const runtime = "nodejs";

const bodySchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(MAX_BULK_IDS),
  tag: z.string().min(1).max(64),
  action: z.enum(["add", "remove"]),
});

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  // Normalize the tag with the same rules the rest of the app uses,
  // so the bulk operation can't sneak in tag values the single-link
  // editor would reject.
  const normalized = parseTags(parsed.data.tag)[0];
  if (!normalized) {
    return NextResponse.json(
      { error: "El nombre de etiqueta no es válido" },
      { status: 400 }
    );
  }

  const ids = Array.from(new Set(parsed.data.ids));
  const rows = await Url.findAll({
    where: { userId, deletedAt: null, id: { [Op.in]: ids } },
  });

  let affected = 0;
  for (const row of rows) {
    const tags = splitTags(row.tags);
    let next: string[];
    if (parsed.data.action === "add") {
      if (tags.includes(normalized)) continue;
      next = [...tags, normalized];
    } else {
      if (!tags.includes(normalized)) continue;
      next = tags.filter((t) => t !== normalized);
    }
    await row.update({ tags: serializeTags(next) });
    affected += 1;
  }

  return NextResponse.json({ ok: true, affected, tag: normalized });
}
