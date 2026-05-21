// Public REST API v1 — link collection.
// Authenticated with an API key: `Authorization: Bearer crtl_...`

import { NextRequest, NextResponse } from "next/server";
import { Url } from "@/models";
import { authenticateApiKey } from "@/lib/api-auth";
import { createShortLink, LinkCreationError } from "@/lib/link-service";
import { consumeShortenLimit } from "@/lib/rate-limit";
import { buildShortUrl } from "@/lib/short-url";
import { getClickCounts } from "@/lib/stats-queries";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { error: "API key inválida o ausente" },
    { status: 401 }
  );
}

// POST /api/v1/links — create a short link.
export async function POST(request: NextRequest) {
  const userId = await authenticateApiKey(request);
  if (!userId) return unauthorized();

  const limit = await consumeShortenLimit(`apikey:${userId}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Límite de solicitudes alcanzado" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { url, customAlias, expirationDate, password, maxClicks } = (body ??
    {}) as Record<string, unknown>;
  if (typeof url !== "string" || !url) {
    return NextResponse.json(
      { error: "El campo 'url' es obligatorio" },
      { status: 400 }
    );
  }

  try {
    const created = await createShortLink({
      originalUrl: url,
      customAlias: typeof customAlias === "string" ? customAlias : null,
      expirationDate:
        typeof expirationDate === "string" ? new Date(expirationDate) : null,
      password: typeof password === "string" ? password : null,
      maxClicks: typeof maxClicks === "number" ? maxClicks : null,
      userId,
    });
    return NextResponse.json(
      {
        id: created.id,
        shortUrl: buildShortUrl(request, created.id),
        originalUrl: created.originalUrl,
        expirationDate: created.expirationDate,
        creationDate: created.creationDate,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof LinkCreationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("API v1 create link error:", error);
    return NextResponse.json(
      { error: "No se pudo crear el enlace" },
      { status: 500 }
    );
  }
}

// GET /api/v1/links — list the caller's links (paginated).
export async function GET(request: NextRequest) {
  const userId = await authenticateApiKey(request);
  if (!userId) return unauthorized();

  const { searchParams } = request.nextUrl;
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 50, 1),
    100
  );
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const { rows, count } = await Url.findAndCountAll({
    where: { userId, deletedAt: null },
    order: [["creationDate", "DESC"]],
    limit,
    offset,
    raw: true,
  });
  const clickCounts = await getClickCounts(rows.map((row) => row.id));

  return NextResponse.json({
    total: count,
    limit,
    offset,
    links: rows.map((row) => ({
      id: row.id,
      shortUrl: buildShortUrl(request, row.id),
      originalUrl: row.originalUrl,
      clicks: clickCounts.get(row.id) ?? 0,
      expirationDate: row.expirationDate ?? null,
      creationDate: row.creationDate,
    })),
  });
}
