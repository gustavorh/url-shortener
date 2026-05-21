import { Url } from "@/models";
import { cacheGet, cacheSet, cacheDel } from "./cache";

export interface ResolvedLink {
  originalUrl: string;
  expirationDate: string | null;
}

const CACHE_TTL_SECONDS = 3600;
const cacheKey = (id: string) => `link:${id}`;

/**
 * Resolves a short code to its target, using Redis as a cache-aside layer
 * when configured. Returns null when the code does not exist.
 */
export async function resolveLink(id: string): Promise<ResolvedLink | null> {
  const cached = await cacheGet(cacheKey(id));
  if (cached) {
    return JSON.parse(cached) as ResolvedLink;
  }

  const record = await Url.findByPk(id, { raw: true });
  if (!record) return null;

  const resolved: ResolvedLink = {
    originalUrl: record.originalUrl,
    expirationDate: record.expirationDate
      ? new Date(record.expirationDate).toISOString()
      : null,
  };
  await cacheSet(cacheKey(id), JSON.stringify(resolved), CACHE_TTL_SECONDS);
  return resolved;
}

/** Drops a link from the cache (call after edits/deletes). */
export async function invalidateLink(id: string): Promise<void> {
  await cacheDel(cacheKey(id));
}
