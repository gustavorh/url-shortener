// POST /api/links/[id]/unlock — verifies a password-protected link's
// password and, on success, returns the resolved destination.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Url, LinkTarget, Click } from "@/models";
import { recordClick } from "@/lib/analytics";
import { chooseDestination } from "@/lib/redirect-resolver";
import { validateAndNormalizeUrl } from "@/lib/url-validation";
import { metrics } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let password = "";
  try {
    const body = await request.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    /* ignore — handled as an empty password below */
  }

  const link = await Url.findByPk(id, { raw: true });
  if (!link || link.deletedAt || !link.passwordHash) {
    return NextResponse.json({ error: "Enlace no encontrado" }, { status: 404 });
  }
  if (link.disabled) {
    return NextResponse.json(
      { error: "El enlace está pausado" },
      { status: 410 }
    );
  }
  if (link.expirationDate && new Date() > new Date(link.expirationDate)) {
    return NextResponse.json({ error: "El enlace ha expirado" }, { status: 410 });
  }
  if (link.maxClicks != null) {
    const clicks = await Click.count({ where: { urlId: id } });
    if (clicks >= link.maxClicks) {
      return NextResponse.json(
        { error: "El enlace alcanzó su límite de clics" },
        { status: 410 }
      );
    }
  }

  const matches = await bcrypt.compare(password, link.passwordHash);
  if (!matches) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  // Password OK — resolve the destination just like a normal redirect.
  const targets = await LinkTarget.findAll({ where: { urlId: id }, raw: true });
  const chosen = chooseDestination(
    link.originalUrl,
    targets.map((t) => ({ url: t.url, kind: t.kind, device: t.device ?? null })),
    request.headers.get("user-agent") || ""
  );

  let url: string;
  try {
    url = validateAndNormalizeUrl(chosen.url);
  } catch {
    return NextResponse.json(
      { error: "El destino del enlace no es válido" },
      { status: 500 }
    );
  }

  await recordClick(request.headers, id, url);
  metrics.redirects.inc({ result: "ok" });

  return NextResponse.json({ url });
}
