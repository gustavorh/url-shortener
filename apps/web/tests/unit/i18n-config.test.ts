import { describe, expect, it } from "vitest";
import {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
} from "@/i18n/config";

describe("i18n config", () => {
  it("ships exactly the locales we shipped translations for", () => {
    expect(AVAILABLE_LOCALES).toEqual(["es", "en"]);
  });

  it("defaults to Spanish (the original UI language)", () => {
    expect(DEFAULT_LOCALE).toBe("es");
    expect(AVAILABLE_LOCALES).toContain(DEFAULT_LOCALE);
  });

  it("uses the next-intl convention for the cookie name", () => {
    expect(LOCALE_COOKIE).toBe("NEXT_LOCALE");
  });

  it("isLocale narrows unknown values safely", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("pt-br")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});
