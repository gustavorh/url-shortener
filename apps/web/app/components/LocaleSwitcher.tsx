"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AVAILABLE_LOCALES, type Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("Locale");
  const tSidebar = useTranslations("Sidebar");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function changeLocale(next: Locale) {
    if (next === currentLocale || pending) return;
    await fetch("/api/account/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-1.5">
        {tSidebar("language")}
      </span>
      <div
        className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        role="group"
        aria-label={tSidebar("language")}
      >
        {AVAILABLE_LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            disabled={pending}
            onClick={() => changeLocale(loc)}
            aria-pressed={loc === currentLocale}
            className={
              loc === currentLocale
                ? "flex-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white"
                : "flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
          >
            {t(loc)}
          </button>
        ))}
      </div>
    </div>
  );
}
