// Session-authenticated updates to a single link the current user owns.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Url } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { invalidateLink } from "@/lib/link-resolver";
import {
  validateAndNormalizeUrl,
  assertNotSSRF,
  UrlValidationError,
} from "@/lib/url-validation";
import { parseTags, serializeTags } from "@/lib/tags";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().trim().max(120).optional(),
  originalUrl: z.string().min(1).optional(),
  expirationDate: z.string().nullable().optional(),
  tags: z.string().optional(),
});

// PATCH /api/links/[id] — updates the title, destination or expiration.
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
  if (!link || link.userId !== userId || link.deletedAt) {
    return NextResponse.json(
      { error: "Enlace no encontrado" },
      { status: 404 }
    );
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updates: {
    title?: string | null;
    originalUrl?: string;
    expirationDate?: Date | null;
    tags?: string | null;
  } = {};

  if (parsed.data.title !== undefined) {
    updates.title = parsed.data.title || null;
  }

  if (parsed.data.tags !== undefined) {
    updates.tags = serializeTags(parseTags(parsed.data.tags));
  }

  if (parsed.data.expirationDate !== undefined) {
    updates.expirationDate = parsed.data.expirationDate
      ? new Date(parsed.data.expirationDate)
      : null;
  }

  // A new destination is validated and SSRF-checked, like on creation.
  if (parsed.data.originalUrl !== undefined) {
    try {
      const normalized = validateAndNormalizeUrl(parsed.data.originalUrl);
      await assertNotSSRF(normalized);
      updates.originalUrl = normalized;
    } catch (error) {
      if (error instanceof UrlValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  }

  await link.update(updates);
  // The cached destination/expiration is now stale.
  await invalidateLink(id);

  return NextResponse.json({ ok: true });
}

// DELETE /api/links/[id] — soft-deletes the link (row and analytics kept).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const link = await Url.findByPk(id);
  if (!link || link.userId !== userId || link.deletedAt) {
    return NextResponse.json(
      { error: "Enlace no encontrado" },
      { status: 404 }
    );
  }

  await link.update({ deletedAt: new Date() });
  await invalidateLink(id);
  return NextResponse.json({ deleted: true });
}
