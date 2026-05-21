import type { NextRequest } from "next/server";

/**
 * Builds the absolute short URL for a code, derived from the request host.
 * Assumes http only for localhost; https everywhere else.
 */
export function buildShortUrl(request: NextRequest, id: string): string {
  const host = request.headers.get("host") || request.nextUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.")
      ? "http"
      : "https");
  return `${protocol}://${host}/${id}`;
}
