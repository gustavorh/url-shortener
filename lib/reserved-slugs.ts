// Slugs that must never be used as a short code: they would collide with
// real application routes and break navigation. Keep this in sync with the
// top-level entries under `app/`.
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "api",
  "login",
  "register",
  "dashboard",
  "stats",
  "qr",
  "u",
  "unlock",
  "recientes",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
