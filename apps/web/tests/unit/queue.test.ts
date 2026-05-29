import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Reset env + the global queue caches between tests. The module caches the
// queue + redis client in globalThis (mirroring lib/redis.ts), so a stale
// instance from one test must not leak into the next.
type GlobalCache = {
  __linklyQueueRedis?: unknown;
  __linklyClickQueue?: unknown;
};

function clearQueueGlobals(): void {
  const g = globalThis as unknown as GlobalCache;
  delete g.__linklyQueueRedis;
  delete g.__linklyClickQueue;
}

describe("lib/queue gating", () => {
  const originalRedisUrl = process.env.REDIS_URL;
  const originalDisabled = process.env.CLICK_QUEUE_DISABLED;

  beforeEach(() => {
    clearQueueGlobals();
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
    if (originalDisabled === undefined) delete process.env.CLICK_QUEUE_DISABLED;
    else process.env.CLICK_QUEUE_DISABLED = originalDisabled;
    clearQueueGlobals();
  });

  it("returns null when REDIS_URL is not set", async () => {
    delete process.env.REDIS_URL;
    delete process.env.CLICK_QUEUE_DISABLED;
    const { getClickQueue, isClickQueueEnabled } = await import("@/lib/queue");
    expect(getClickQueue()).toBeNull();
    expect(isClickQueueEnabled()).toBe(false);
  });

  it("returns null when CLICK_QUEUE_DISABLED=1 even with REDIS_URL set", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.CLICK_QUEUE_DISABLED = "1";
    const { getClickQueue, isClickQueueEnabled } = await import("@/lib/queue");
    expect(getClickQueue()).toBeNull();
    expect(isClickQueueEnabled()).toBe(false);
  });

  it("enqueueClick returns false when the queue is disabled", async () => {
    delete process.env.REDIS_URL;
    delete process.env.CLICK_QUEUE_DISABLED;
    const { enqueueClick } = await import("@/lib/queue");
    const ok = await enqueueClick({
      urlId: "abc",
      targetUrl: "https://example.com",
      userAgent: null,
      referrer: null,
      rawIp: "1.1.1.1",
      country: null,
      timestamp: Date.now(),
    });
    expect(ok).toBe(false);
  });
});
