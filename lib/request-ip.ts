/**
 * Resolves the real client IP from common proxy/CDN headers.
 * Order matters: Cloudflare's headers are most trustworthy when present,
 * then the first hop of x-forwarded-for, then x-real-ip.
 */
export function resolveClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwarded = forwardedFor
    ? forwardedFor.split(",")[0]?.trim()
    : null;

  return (
    headers.get("true-client-ip") ||
    headers.get("cf-connecting-ip") ||
    firstForwarded ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
