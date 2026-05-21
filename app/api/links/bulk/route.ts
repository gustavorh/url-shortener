// POST /api/links/bulk
// Shortens many URLs at once for the signed-in user. Each URL is processed
// independently so one failure never aborts the batch.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { createShortLink, LinkCreationError } from "@/lib/link-service";
import { buildShortUrl } from "@/lib/short-url";

export const runtime = "nodejs";

const MAX_URLS = 100;

const bodySchema = z.object({
  urls: z.array(z.string()).min(1).max(MAX_URLS),
});

interface BulkItemResult {
  originalUrl: string;
  ok: boolean;
  id?: string;
  shortUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para importar enlaces" },
      { status: 401 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Envía entre 1 y ${MAX_URLS} URLs` },
      { status: 400 }
    );
  }

  const results: BulkItemResult[] = [];
  for (const rawUrl of parsed.data.urls) {
    const originalUrl = rawUrl.trim();
    if (!originalUrl) continue;
    try {
      const created = await createShortLink({ originalUrl, userId });
      results.push({
        originalUrl,
        ok: true,
        id: created.id,
        shortUrl: buildShortUrl(request, created.id),
      });
    } catch (error) {
      results.push({
        originalUrl,
        ok: false,
        error:
          error instanceof LinkCreationError
            ? error.message
            : "Error al acortar la URL",
      });
    }
  }

  return NextResponse.json(
    {
      total: results.length,
      created: results.filter((item) => item.ok).length,
      results,
    },
    { status: 200 }
  );
}
