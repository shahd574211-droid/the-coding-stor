/**
 * تحويل العملة من الدينار العراقي (IQD) إلى عملات أخرى.
 * الأسعار في قاعدة البيانات تُعامل كدينار عراقي للعرض.
 */

import { formatPrice, type PriceLocale } from "./utils";

export const CURRENCY_COOKIE = "currency";

export type CurrencyCode = "IQD" | "USD" | "EUR";

/** سعر صرف من IQD إلى العملة الأخرى (كم وحدة من العملة الأجنبية لكل 1 IQD) */
const RATES_FROM_IQD: Record<Exclude<CurrencyCode, "IQD">, number> = {
  USD: 1 / 1310,
  EUR: 1 / 1420,
};

/** العملات المتاحة للعرض */
export const CURRENCIES: { code: CurrencyCode; labelKey: string }[] = [
  { code: "IQD", labelKey: "currency.iqd" },
  { code: "USD", labelKey: "currency.usd" },
  { code: "EUR", labelKey: "currency.eur" },
];

export function isValidCurrency(value: string): value is CurrencyCode {
  return value === "IQD" || value === "USD" || value === "EUR";
}

/** القيمة المخزنة بالآلاف (50 = 50,000 د.ع) */
const IQD_THOUSANDS = 1000;

/** تحويل مبلغ من IQD إلى العملة المطلوبة. المدخل بالآلاف للدينار. */
export function convertFromIQD(amountIQDInThousands: number, toCurrency: CurrencyCode): number {
  const fullIQD = amountIQDInThousands * IQD_THOUSANDS;
  if (toCurrency === "IQD") return Math.round(fullIQD);
  const rate = RATES_FROM_IQD[toCurrency];
  const converted = fullIQD * rate;
  return Math.round(converted * 100) / 100;
}

/**
 * تنسيق السعر بعملة المستخدم.
 * المبلغ المُمرّر مخزَن بالآلاف (50 = 50,000 د.ع). العرض: د.ع بصيغة 50,000 أو تحويل لـ USD/EUR.
 */
export function formatPriceInUserCurrency(
  amountStoredInThousands: number | string | { toString(): string },
  userCurrency: CurrencyCode,
  locale?: PriceLocale
): string {
  const num = typeof amountStoredInThousands === "number" ? amountStoredInThousands : parseFloat(String(amountStoredInThousands));
  const amount = convertFromIQD(num, userCurrency);
  return formatPrice(userCurrency === "IQD" ? num : amount, userCurrency, locale);
}
