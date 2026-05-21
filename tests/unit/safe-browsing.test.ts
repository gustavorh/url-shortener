import { describe, it, expect, afterEach } from "vitest";
import { isUrlUnsafe } from "@/lib/safe-browsing";

describe("isUrlUnsafe", () => {
  afterEach(() => {
    delete process.env.SAFE_BROWSING_API_KEY;
  });

  it("treats every URL as safe when no API key is configured", async () => {
    delete process.env.SAFE_BROWSING_API_KEY;
    expect(await isUrlUnsafe("https://example.com")).toBe(false);
  });
});
