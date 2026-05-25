import geoip from "geoip-lite";

/**
 * Resolves a 2-letter ISO country code for a click. Prefers a CDN/proxy
 * header (zero-cost and accurate when present), then falls back to the
 * geoip-lite database bundled with the package. Returns null when unknown.
 */
export function resolveCountry(headers: Headers, ip: string): string | null {
  const headerCountry =
    headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");
  if (headerCountry && headerCountry.length === 2 && headerCountry !== "XX") {
    return headerCountry.toUpperCase();
  }

  if (ip && ip !== "unknown") {
    const geo = geoip.lookup(ip);
    if (geo?.country) {
      return geo.country.toUpperCase();
    }
  }

  return null;
}
