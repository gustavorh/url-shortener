/**
 * Extracts the bare domain from a referrer URL (a leading "www." is
 * stripped). Returns null for missing or unparseable referrers.
 */
export function referrerDomain(
  referrer: string | null | undefined
): string | null {
  if (!referrer) return null;
  try {
    const { hostname } = new URL(referrer);
    return hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
