import { describe, it, expect } from "vitest";
import {
  BASE62_CHARS,
  hashToSlug,
  toBase62,
  generateUniqueSlug,
  validateCustomAlias,
} from "@/lib/slug";

describe("toBase62 / hashToSlug", () => {
  it("produces a 5-character base62 string", () => {
    const slug = hashToSlug("https://example.com");
    expect(slug).toHaveLength(5);
    expect([...slug].every((char) => BASE62_CHARS.includes(char))).toBe(true);
  });

  it("is deterministic for the same input", () => {
    expect(hashToSlug("https://example.com")).toBe(
      hashToSlug("https://example.com")
    );
  });

  it("produces different slugs for different inputs", () => {
    expect(hashToSlug("https://a.com")).not.toBe(hashToSlug("https://b.com"));
  });

  it("pads short encodings to 5 characters", () => {
    expect(toBase62(Buffer.from([0]))).toHaveLength(5);
  });
});

describe("generateUniqueSlug", () => {
  it("returns the first slug when there is no collision", async () => {
    const slug = await generateUniqueSlug("https://x.com", async () => false);
    expect(slug).toHaveLength(5);
  });

  it("salts the hash until a free slug is found", async () => {
    let calls = 0;
    const slug = await generateUniqueSlug("https://x.com", async () => {
      calls += 1;
      return calls < 3; // first two slugs are taken
    });
    expect(calls).toBe(3);
    expect(slug).toHaveLength(5);
  });

  it("throws after 100 failed attempts", async () => {
    await expect(
      generateUniqueSlug("https://x.com", async () => true)
    ).rejects.toThrow(/unique/i);
  });
});

describe("validateCustomAlias", () => {
  it("accepts well-formed aliases", () => {
    expect(validateCustomAlias("my-link_1").valid).toBe(true);
    expect(validateCustomAlias("abc").valid).toBe(true);
  });

  it("rejects aliases that are too short or too long", () => {
    expect(validateCustomAlias("ab").valid).toBe(false);
    expect(validateCustomAlias("a".repeat(33)).valid).toBe(false);
  });

  it("rejects invalid characters", () => {
    expect(validateCustomAlias("bad alias").valid).toBe(false);
    expect(validateCustomAlias("nope!").valid).toBe(false);
  });

  it("rejects reserved route names", () => {
    expect(validateCustomAlias("api").valid).toBe(false);
    expect(validateCustomAlias("dashboard").valid).toBe(false);
    expect(validateCustomAlias("Stats").valid).toBe(false);
  });
});
