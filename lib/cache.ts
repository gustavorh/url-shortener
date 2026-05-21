import { getRedisClient } from "./redis";

// Optional Redis cache. When REDIS_URL is unset every operation is a no-op
// and the app simply queries MySQL — Redis is never a hard dependency.
// Used as a cache-aside layer for the hot redirect path (GET /[id]).

/** Returns true when a Redis cache is configured. */
export function isCacheEnabled(): boolean {
  return getRedisClient() !== null;
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {
    /* cache writes are best-effort */
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* best-effort */
  }
}
