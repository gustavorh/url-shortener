import { describe, it, expect } from "vitest";
import { appendUtmParams, hasAnyUtm } from "@/lib/utm";

describe("appendUtmParams", () => {
  it("appends the provided UTM parameters", () => {
    const url = new URL(
      appendUtmParams("https://example.com", {
        source: "twitter",
        medium: "social",
        campaign: "launch",
      })
    );
    expect(url.searchParams.get("utm_source")).toBe("twitter");
    expect(url.searchParams.get("utm_medium")).toBe("social");
    expect(url.searchParams.get("utm_campaign")).toBe("launch");
  });

  it("skips empty fields", () => {
    const result = appendUtmParams("https://example.com", {
      source: "x",
      medium: "",
    });
    expect(result).not.toContain("utm_medium");
  });

  it("adds an https scheme when missing", () => {
    const result = appendUtmParams("example.com", { source: "x" });
    expect(result.startsWith("https://")).toBe(true);
  });

  it("preserves existing query parameters", () => {
    const url = new URL(
      appendUtmParams("https://example.com/?a=1", { source: "x" })
    );
    expect(url.searchParams.get("a")).toBe("1");
    expect(url.searchParams.get("utm_source")).toBe("x");
  });
});

describe("hasAnyUtm", () => {
  it("returns false when every field is blank", () => {
    expect(hasAnyUtm({ source: "", medium: "  " })).toBe(false);
  });

  it("returns true when any field has a value", () => {
    expect(hasAnyUtm({ campaign: "launch" })).toBe(true);
  });
});
