"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./messages";
import type { Locale } from "./messages";

/** Set locale cookie on the server so the next request sees it. */
export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
  });
}
