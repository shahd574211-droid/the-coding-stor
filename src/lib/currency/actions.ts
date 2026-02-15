"use server";

import { cookies } from "next/headers";
import { CURRENCY_COOKIE, isValidCurrency, type CurrencyCode } from "../currency";

export async function setCurrencyAction(currency: string) {
  const code = currency.toUpperCase();
  if (!isValidCurrency(code)) return;
  const cookieStore = await cookies();
  cookieStore.set(CURRENCY_COOKIE, code, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
  });
}
