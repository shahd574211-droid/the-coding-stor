/**
 * خصم عام لجميع المنتجات.
 * النسبة من متغير البيئة GLOBAL_DISCOUNT_PERCENT (0 = بدون خصم).
 */

const ENV_KEY = "GLOBAL_DISCOUNT_PERCENT";

/** نسبة الخصم (0–100). 0 = لا يوجد خصم. */
export function getGlobalDiscountPercent(): number {
  const raw = process.env[ENV_KEY];
  if (raw == null || raw === "") return 0;
  const n = parseFloat(raw);
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/** السعر بعد تطبيق الخصم. المدخل كما في قاعدة البيانات (بالآلاف للدينار). */
export function getPriceAfterDiscount(price: number): number {
  const percent = getGlobalDiscountPercent();
  if (percent <= 0) return price;
  return price * (1 - percent / 100);
}

/** هل يوجد خصم عام مفعّل؟ */
export function hasGlobalDiscount(): boolean {
  return getGlobalDiscountPercent() > 0;
}
