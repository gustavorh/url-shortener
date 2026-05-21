import Redis from "ioredis";

// Optional Redis cache. When REDIS_URL is unset every operation is a no-op
// and the app simply queries MySQL — Redis is never a hard dependency.
// Used as a cache-aside layer for the hot redirect path (GET /[id]).

let client: Redis | null = null;
let initialized = false;

function getClient(): Redis | null {
  if (initialized) return client;
  initialized = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      // Stop retrying after a few attempts so a Redis outage degrades
      // gracefully to direct MySQL reads instead of hanging requests.
      retryStrategy: (times) =>
        times > 3 ? null : Math.min(times * 200, 1000),
    });
    client.on("error", (err) =>
      console.error("Redis error:", err.message)
    );
  } catch (err) {
    console.error("Failed to initialize Redis:", err);
    client = null;
  }
  return client;
}

/** Returns true when a Redis cache is configured. */
export function isCacheEnabled(): boolean {
  return getClient() !== null;
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getClient();
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
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {
    /* cache writes are best-effort */
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* best-effort */
  }
}
