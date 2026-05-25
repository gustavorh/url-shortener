// POST /api/shorten-url
// Rate-limits by client IP, then delegates to the shared link-creation
// service (URL validation, SSRF guard, alias/slug, persistence).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { resolveClientIp } from "@/lib/request-ip";
import { consumeShortenLimit } from "@/lib/rate-limit";
import { createShortLink, LinkCreationError } from "@/lib/link-service";
import { buildShortUrl } from "@/lib/short-url";

export const runtime = "nodejs";

const bodySchema = z.object({
  originalUrl: z.string().min(1, "La URL es obligatoria"),
  expirationDate: z.string().optional(),
  customAlias: z.string().optional(),
  password: z.string().optional(),
  maxClicks: z.number().int().positive().optional(),
  activeFrom: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by client IP before doing any work.
    const ip = resolveClientIp(request.headers);
    const limit = await consumeShortenLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta de nuevo en un momento" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const created = await createShortLink({
      originalUrl: parsed.data.originalUrl,
      customAlias: parsed.data.customAlias,
      expirationDate: parsed.data.expirationDate
        ? new Date(parsed.data.expirationDate)
        : null,
      password: parsed.data.password,
      maxClicks: parsed.data.maxClicks,
      activeFrom: parsed.data.activeFrom
        ? new Date(parsed.data.activeFrom)
        : null,
      userId: await getCurrentUserId(),
    });

    return NextResponse.json(
      {
        shortUrl: buildShortUrl(request, created.id),
        id: created.id,
        originalUrl: created.originalUrl,
        expirationDate: created.expirationDate,
        creationDate: created.creationDate,
        reused: created.reused,
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
    console.error("Error shortening URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 }
    );
  }
}
