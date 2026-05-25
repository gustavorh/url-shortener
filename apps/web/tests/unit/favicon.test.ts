import { describe, it, expect } from "vitest";
import { faviconUrl } from "@/lib/favicon";

describe("faviconUrl", () => {
  it("builds a favicon URL from the destination's hostname", () => {
    const url = faviconUrl("https://example.com/some/path");
    expect(url).toContain("example.com");
    expect(url).toContain("sz=32");
  });

  it("honors a custom size", () => {
    expect(faviconUrl("https://example.com", 64)).toContain("sz=64");
  });

  it("returns null for an invalid URL", () => {
    expect(faviconUrl("not a url")).toBeNull();
  });
});
