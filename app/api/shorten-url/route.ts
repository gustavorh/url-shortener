// POST /api/shorten-url
// Validates and SSRF-checks the target URL, rate-limits by client IP,
// resolves a short code (generated or a user-chosen custom alias), and
// persists the link — associated to the signed-in user when there is one.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Url } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { resolveClientIp } from "@/lib/request-ip";
import { consumeShortenLimit } from "@/lib/rate-limit";
import {
  validateAndNormalizeUrl,
  assertNotSSRF,
  UrlValidationError,
} from "@/lib/url-validation";
import { generateUniqueSlug, validateCustomAlias } from "@/lib/slug";
import { buildShortUrl } from "@/lib/short-url";

export const runtime = "nodejs";

const bodySchema = z.object({
  originalUrl: z.string().min(1, "La URL es obligatoria"),
  expirationDate: z.string().optional(),
  customAlias: z.string().optional(),
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

    // Validate the target URL and reject SSRF-prone destinations.
    let originalUrl: string;
    try {
      originalUrl = validateAndNormalizeUrl(parsed.data.originalUrl);
      await assertNotSSRF(originalUrl);
    } catch (error) {
      if (error instanceof UrlValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Resolve the short code: a validated custom alias or a generated slug.
    let shortUrlId: string;
    const customAlias = parsed.data.customAlias?.trim();
    if (customAlias) {
      const aliasCheck = validateCustomAlias(customAlias);
      if (!aliasCheck.valid) {
        return NextResponse.json(
          { error: aliasCheck.reason },
          { status: 400 }
        );
      }
      if (await Url.findByPk(customAlias)) {
        return NextResponse.json(
          { error: "Ese alias ya está en uso, elige otro" },
          { status: 409 }
        );
      }
      shortUrlId = customAlias;
    } else {
      shortUrlId = await generateUniqueSlug(
        originalUrl,
        async (slug) => (await Url.findByPk(slug)) !== null
      );
    }

    const expirationDate = parsed.data.expirationDate
      ? new Date(parsed.data.expirationDate)
      : null;

    // Associate the link with the signed-in user, if any.
    const userId = await getCurrentUserId();

    const created = await Url.create({
      id: shortUrlId,
      originalUrl,
      expirationDate,
      userId,
    });

    return NextResponse.json(
      {
        shortUrl: buildShortUrl(request, shortUrlId),
        id: shortUrlId,
        originalUrl,
        expirationDate,
        creationDate: created.creationDate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error shortening URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 }
    );
  }
}
