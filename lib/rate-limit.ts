import {
  RateLimiterMemory,
  RateLimiterRedis,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";
import { getRedisClient } from "./redis";

// URL-shortening quota: 10 requests per rolling 60 seconds per key (IP).
const LIMITER_OPTIONS = { points: 10, duration: 60, keyPrefix: "shorten" };

// Distributed when Redis is available (shared across replicas), in-process
// otherwise. With Redis, an in-memory insurance limiter keeps enforcing the
// quota if Redis becomes unreachable.
function createLimiter(): RateLimiterAbstract {
  const redis = getRedisClient();
  if (redis) {
    return new RateLimiterRedis({
      ...LIMITER_OPTIONS,
      storeClient: redis,
      insuranceLimiter: new RateLimiterMemory(LIMITER_OPTIONS),
    });
  }
  return new RateLimiterMemory(LIMITER_OPTIONS);
}

const globalForLimiter = globalThis as unknown as {
  __cortalaShortenLimiter?: RateLimiterAbstract;
};
const shortenLimiter: RateLimiterAbstract =
  globalForLimiter.__cortalaShortenLimiter ??
  (globalForLimiter.__cortalaShortenLimiter = createLimiter());

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Consumes one unit of the URL-shortening quota for the given key (IP). */
export async function consumeShortenLimit(
  key: string
): Promise<RateLimitResult> {
  try {
    await shortenLimiter.consume(key);
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (rejection) {
    const msBeforeNext =
      rejection &&
      typeof rejection === "object" &&
      "msBeforeNext" in rejection
        ? Number((rejection as { msBeforeNext: number }).msBeforeNext)
        : 60_000;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(msBeforeNext / 1000)),
    };
  }
}
