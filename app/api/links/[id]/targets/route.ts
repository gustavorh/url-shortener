// Manage the device/A-B targets of a link the current user owns.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Url, LinkTarget } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { invalidateLink } from "@/lib/link-resolver";
import {
  validateAndNormalizeUrl,
  assertNotSSRF,
  UrlValidationError,
} from "@/lib/url-validation";

export const runtime = "nodejs";

const createSchema = z.object({
  url: z.string().min(1),
  kind: z.enum(["device", "rotation"]),
  device: z.enum(["ios", "android", "desktop"]).optional(),
});

// Confirms the link exists and belongs to the signed-in user.
async function requireOwnedLink(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "No autorizado", status: 401 as const };
  const link = await Url.findByPk(id, { raw: true });
  if (!link || link.userId !== userId) {
    return { error: "Enlace no encontrado", status: 404 as const };
  }
  return { userId };
}

// GET /api/links/[id]/targets
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await requireOwnedLink(id);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  const targets = await LinkTarget.findAll({
    where: { urlId: id },
    order: [["createdAt", "ASC"]],
    raw: true,
  });
  return NextResponse.json({ targets });
}

// POST /api/links/[id]/targets — add a device override or rotation variant.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await requireOwnedLink(id);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { kind, device } = parsed.data;
  if (kind === "device" && !device) {
    return NextResponse.json(
      { error: "Indica el dispositivo (ios, android o desktop)" },
      { status: 400 }
    );
  }

  let url: string;
  try {
    url = validateAndNormalizeUrl(parsed.data.url);
    await assertNotSSRF(url);
  } catch (error) {
    if (error instanceof UrlValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  // Only one override per device — replace any existing one.
  if (kind === "device" && device) {
    await LinkTarget.destroy({
      where: { urlId: id, kind: "device", device },
    });
  }

  const target = await LinkTarget.create({
    urlId: id,
    url,
    kind,
    device: kind === "device" ? device : null,
  });
  await invalidateLink(id);

  return NextResponse.json({ target }, { status: 201 });
}
