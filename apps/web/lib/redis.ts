import Redis from "ioredis";

// Single shared Redis connection, used by both the cache and the rate
// limiter. Redis is optional: with no REDIS_URL this returns null and
// callers fall back to in-process behaviour.

const globalForRedis = globalThis as unknown as {
  __linklyRedis?: Redis | null;
};

export function getRedisClient(): Redis | null {
  if (globalForRedis.__linklyRedis !== undefined) {
    return globalForRedis.__linklyRedis;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.__linklyRedis = null;
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      // Stop retrying after a few attempts so an outage degrades gracefully.
      retryStrategy: (times) =>
        times > 3 ? null : Math.min(times * 200, 1000),
    });
    client.on("error", (err) => console.error("Redis error:", err.message));
    globalForRedis.__linklyRedis = client;
    return client;
  } catch (err) {
    console.error("Failed to initialize Redis:", err);
    globalForRedis.__linklyRedis = null;
    return null;
  }
}
