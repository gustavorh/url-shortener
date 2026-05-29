// Public REST API v1 — link collection.
// Authenticated with an API key: `Authorization: Bearer crtl_...`

import { NextRequest, NextResponse } from "next/server";
import { Op, type WhereOptions } from "sequelize";
import { Url } from "@/models";
import { authenticateApiKey } from "@/lib/api-auth";
import { createShortLink, LinkCreationError } from "@/lib/link-service";
import { consumeShortenLimit } from "@/lib/rate-limit";
import { buildShortUrl } from "@/lib/short-url";
import { getClickCounts } from "@/lib/stats-queries";
import { splitTags } from "@/lib/tags";
import {
  CreateLinkBodySchema,
  ListLinksQuerySchema,
} from "@linkly/schemas/v1";
import { parseJsonBody, parseSearchParams } from "@/lib/api-validation";

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

  const parsed = await parseJsonBody(request, CreateLinkBodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const created = await createShortLink({
      originalUrl: body.url,
      customAlias: body.customAlias,
      expirationDate: body.expirationDate,
      password: body.password,
      maxClicks: body.maxClicks,
      activeFrom: body.activeFrom,
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

  const parsed = parseSearchParams(
    request.nextUrl.searchParams,
    ListLinksQuerySchema
  );
  if (!parsed.ok) return parsed.response;
  const { limit, offset, search, tag } = parsed.data;

  const where: WhereOptions = { userId, deletedAt: null };
  if (search) {
    const term = `%${search}%`;
    Object.assign(where, {
      [Op.or]: [
        { id: { [Op.like]: term } },
        { originalUrl: { [Op.like]: term } },
        { title: { [Op.like]: term } },
      ],
    });
  }
  if (tag) {
    Object.assign(where, { tags: { [Op.like]: `%${tag}%` } });
  }

  const { rows, count } = await Url.findAndCountAll({
    where,
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
      title: row.title ?? null,
      tags: splitTags(row.tags),
      clicks: clickCounts.get(row.id) ?? 0,
      disabled: !!row.disabled,
      expirationDate: row.expirationDate ?? null,
      creationDate: row.creationDate,
    })),
  });
}
