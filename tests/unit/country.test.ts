import { describe, it, expect } from "vitest";
import { countryFlag } from "@/lib/country";

describe("countryFlag", () => {
  it("maps a country code to its flag emoji", () => {
    expect(countryFlag("US")).toBe("🇺🇸");
    expect(countryFlag("cl")).toBe("🇨🇱");
  });

  it("returns an empty string for missing or malformed codes", () => {
    expect(countryFlag(null)).toBe("");
    expect(countryFlag("USA")).toBe("");
    expect(countryFlag("1")).toBe("");
  });
});
