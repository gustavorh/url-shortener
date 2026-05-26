export const AVAILABLE_LOCALES = ["es", "en"] as const;
export type Locale = (typeof AVAILABLE_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (AVAILABLE_LOCALES as readonly string[]).includes(value)
  );
}
