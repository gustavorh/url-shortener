import { RateLimiterMemory } from "rate-limiter-flexible";

// In-memory limiter. Adequate for the current single-container deployment:
// the Node process is long-lived so the counters persist between requests.
// Limitation: counters reset on restart and are not shared across replicas —
// move to RateLimiterRedis if the app is ever scaled horizontally.
const shortenLimiter = new RateLimiterMemory({
  points: 10, // allowed requests
  duration: 60, // per rolling 60 seconds
});

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
