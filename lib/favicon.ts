// Builds favicon image URLs for a destination. Uses Google's public
// favicon service so no server-side fetching is needed.

/** Returns a favicon URL for the destination's domain, or null if invalid. */
export function faviconUrl(targetUrl: string, size = 32): string | null {
  try {
    const { hostname } = new URL(targetUrl);
    if (!hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      hostname
    )}&sz=${size}`;
  } catch {
    return null;
  }
}
