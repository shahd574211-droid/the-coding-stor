import { cookies } from "next/headers";
import { CURRENCY_COOKIE, isValidCurrency, type CurrencyCode } from "../currency";

const DEFAULT_CURRENCY: CurrencyCode = "IQD";

export async function getCurrency(): Promise<CurrencyCode> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CURRENCY_COOKIE)?.value?.toUpperCase();
  if (value && isValidCurrency(value)) return value;
  return DEFAULT_CURRENCY;
}
