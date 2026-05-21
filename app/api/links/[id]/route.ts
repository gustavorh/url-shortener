// Session-authenticated updates to a single link the current user owns.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Url } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().trim().max(120).optional(),
});

// PATCH /api/links/[id] — currently updates the link's display title.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const link = await Url.findByPk(id);
  if (!link || link.userId !== userId) {
    return NextResponse.json(
      { error: "Enlace no encontrado" },
      { status: 404 }
    );
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.title !== undefined) {
    await link.update({ title: parsed.data.title || null });
  }
  return NextResponse.json({ ok: true });
}
