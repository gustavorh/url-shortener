import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey } from "@/lib/api-key";

describe("generateApiKey", () => {
  it("creates a prefixed key with a matching hash and display prefix", () => {
    const { key, hash, prefix } = generateApiKey();
    expect(key.startsWith("crtl_")).toBe(true);
    expect(prefix).toBe(key.slice(0, 12));
    expect(hash).toBe(hashApiKey(key));
    expect(hash).toHaveLength(64);
  });

  it("produces a unique key each call", () => {
    expect(generateApiKey().key).not.toBe(generateApiKey().key);
  });
});

describe("hashApiKey", () => {
  it("is deterministic for the same key", () => {
    expect(hashApiKey("crtl_example")).toBe(hashApiKey("crtl_example"));
  });

  it("differs for different keys", () => {
    expect(hashApiKey("crtl_a")).not.toBe(hashApiKey("crtl_b"));
  });
});
