import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
} from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;

  // Static imports keep all locales in the bundle. Cheap (≈2KB gzipped per
  // locale) and lets the cookie flip without a hard reload.
  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});

export { AVAILABLE_LOCALES, DEFAULT_LOCALE };
