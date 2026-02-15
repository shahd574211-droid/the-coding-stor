import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_CURRENCY = "IQD";

export type PriceLocale = "en" | "ar";

export function formatPrice(
  amount: number | string | { toString(): string },
  currency: string = DEFAULT_CURRENCY,
  locale?: PriceLocale
): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount));
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  if (code === "IQD") {
    const useEnglish = locale === "en";
    // الأسعار مخزنة بالآلاف: 50 = 50,000 د.ع — نعرضها بالأرقام الكاملة مع الفاصلة
    const valueInFullDinars = num * 1000;
    return new Intl.NumberFormat(useEnglish ? "en" : "ar-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(valueInFullDinars);
  }
  // USD و EUR: حتى خانتان عشريتان (لتجنب ظهور 0 للمبالغ الصغيرة بعد التحويل)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
