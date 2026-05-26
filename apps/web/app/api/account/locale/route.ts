// POST /api/account/locale — persists the caller's UI language and sets the
// NEXT_LOCALE cookie so the next render picks it up immediately. Body shape:
//   { locale: "es" | "en" }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { User } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import {
  AVAILABLE_LOCALES,
  LOCALE_COOKIE,
} from "@/i18n/config";

export const runtime = "nodejs";

const bodySchema = z.object({
  locale: z.enum(AVAILABLE_LOCALES),
});

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  // Anonymous visitors are allowed to flip the cookie — registration and
  // landing also need translation. Only persist to the DB if the user is
  // signed in.
  const parsed = bodySchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Locale inválido" },
      { status: 400 }
    );
  }

  const { locale } = parsed.data;

  if (userId) {
    await User.update({ locale }, { where: { id: userId } });
  }

  const response = NextResponse.json({ ok: true, locale });
  // 1 year, available to all paths, lax so cross-site navigations preserve
  // the preference.
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
