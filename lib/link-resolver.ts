import { Url, LinkTarget } from "@/models";
import { cacheGet, cacheSet, cacheDel } from "./cache";
import type { TargetRule } from "./redirect-resolver";

export interface ResolvedLink {
  originalUrl: string;
  expirationDate: string | null;
  targets: TargetRule[];
}

const CACHE_TTL_SECONDS = 3600;
const cacheKey = (id: string) => `link:${id}`;

/**
 * Resolves a short code to its target (including device/A-B targets), using
 * Redis as a cache-aside layer when configured. Returns null when the code
 * does not exist.
 */
export async function resolveLink(id: string): Promise<ResolvedLink | null> {
  const cached = await cacheGet(cacheKey(id));
  if (cached) {
    return JSON.parse(cached) as ResolvedLink;
  }

  const record = await Url.findByPk(id, { raw: true });
  // Soft-deleted links behave as if they do not exist.
  if (!record || record.deletedAt) return null;

  const targetRows = await LinkTarget.findAll({
    where: { urlId: id },
    raw: true,
  });

  const resolved: ResolvedLink = {
    originalUrl: record.originalUrl,
    expirationDate: record.expirationDate
      ? new Date(record.expirationDate).toISOString()
      : null,
    targets: targetRows.map((target) => ({
      url: target.url,
      kind: target.kind,
      device: target.device ?? null,
    })),
  };
  await cacheSet(cacheKey(id), JSON.stringify(resolved), CACHE_TTL_SECONDS);
  return resolved;
}

/** Drops a link from the cache (call after edits/deletes/target changes). */
export async function invalidateLink(id: string): Promise<void> {
  await cacheDel(cacheKey(id));
}
