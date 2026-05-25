import { describe, it, expect, beforeEach, afterEach } from "vitest";

// buildClickPayload runs entirely on headers — no DB, no queue, no network.
// Verify it captures the fields the worker (and the synchronous fallback)
// need, and that the queue gate is properly closed by default so the unit
// suite never tries to open a Redis connection.

type GlobalCache = {
  __cortalaQueueRedis?: unknown;
  __cortalaClickQueue?: unknown;
};

function clearQueueGlobals(): void {
  const g = globalThis as unknown as GlobalCache;
  delete g.__cortalaQueueRedis;
  delete g.__cortalaClickQueue;
}

describe("lib/analytics buildClickPayload", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
    clearQueueGlobals();
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
    clearQueueGlobals();
  });

  it("captures urlId, targetUrl, user-agent and referrer from headers", async () => {
    const { buildClickPayload } = await import("@/lib/analytics");
    const headers = new Headers({
      "user-agent": "Mozilla/5.0 (Macintosh)",
      referer: "https://news.ycombinator.com/",
      "x-forwarded-for": "8.8.8.8",
    });
    const payload = buildClickPayload(headers, "abc", "https://example.com");
    expect(payload.urlId).toBe("abc");
    expect(payload.targetUrl).toBe("https://example.com");
    expect(payload.userAgent).toBe("Mozilla/5.0 (Macintosh)");
    expect(payload.referrer).toBe("https://news.ycombinator.com/");
    expect(payload.rawIp).toBe("8.8.8.8");
    expect(typeof payload.timestamp).toBe("number");
  });

  it("normalizes missing headers to null", async () => {
    const { buildClickPayload } = await import("@/lib/analytics");
    const payload = buildClickPayload(new Headers(), "xyz");
    expect(payload.userAgent).toBeNull();
    expect(payload.referrer).toBeNull();
    expect(payload.targetUrl).toBeNull();
    expect(payload.rawIp).toBe("unknown");
  });

  it("uses cf-ipcountry when present (zero-cost geo)", async () => {
    const { buildClickPayload } = await import("@/lib/analytics");
    const headers = new Headers({ "cf-ipcountry": "cl" });
    const payload = buildClickPayload(headers, "abc");
    expect(payload.country).toBe("CL");
  });
});
