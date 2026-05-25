import { describe, it, expect } from "vitest";
import { referrerDomain } from "@/lib/referrer";

describe("referrerDomain", () => {
  it("extracts the hostname from a referrer URL", () => {
    expect(referrerDomain("https://news.example.com/article")).toBe(
      "news.example.com"
    );
  });

  it("strips a leading www.", () => {
    expect(referrerDomain("https://www.google.com/search")).toBe("google.com");
  });

  it("returns null for missing or invalid referrers", () => {
    expect(referrerDomain(null)).toBeNull();
    expect(referrerDomain(undefined)).toBeNull();
    expect(referrerDomain("not a url")).toBeNull();
  });
});
