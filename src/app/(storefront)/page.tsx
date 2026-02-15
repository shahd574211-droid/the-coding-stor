import Link from "next/link";
import { getPublishedProducts, getCategories } from "@/server/actions/products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPriceInUserCurrency } from "@/lib/currency";
import Image from "next/image";
import { getLocale } from "@/lib/i18n/server";
import { getTranslations, t as tFn } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/currency/server";
import { getGlobalDiscountPercent, getPriceAfterDiscount } from "@/lib/discount";

export default async function HomePage() {
  const [locale, currency, { products }, categories] = await Promise.all([
    getLocale(),
    getCurrency(),
    getPublishedProducts({ limit: 8 }),
    getCategories(),
  ]);
  const translations = getTranslations(locale);
  const t = (key: string, params?: Record<string, string | number>) => tFn(translations, key, params);
  const discountPercent = getGlobalDiscountPercent();

  return (
    <div className="space-y-10">
      {categories.length > 0 && (
        <section className="space-y-3 text-start">
          <h2 className="text-sm font-medium text-[#FFE210] uppercase tracking-wider">{t("home.categories")}</h2>
          <ul className="flex flex-wrap gap-2 rtl:flex-row-reverse rtl:justify-end">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/products?category=${cat.slug}`} prefetch className="inline-block">
                  <span className="inline-flex rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white hover:border-white/30 transition-all duration-200">
                    {cat.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-5 text-start">
        <div className="flex items-center justify-between flex-wrap gap-3 rtl:flex-row-reverse">
          <h2 className="text-lg font-semibold text-primary-on-dark">{t("home.featured")}</h2>
          <Link href="/products" prefetch>
            <span className="inline-flex items-center rounded-xl bg-[#28AC28] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
              {t("home.viewAll")}
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden group glass-card-on-dark border-white/20 rounded-2xl transition-all duration-200 hover:border-white/30 hover:shadow-xl">
              <Link href={`/products/${p.slug}`} prefetch className="block">
                <div className="aspect-square relative bg-black/30 overflow-hidden">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-on-dark text-sm">
                      {t("products.noImage")}
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 text-on-dark text-sm">{p.name}</h3>
                  {p.category && (
                    <p className="text-xs text-muted-on-dark mt-0.5">{p.category.name}</p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex flex-col items-start gap-0.5">
                  {discountPercent > 0 ? (
                    <>
                      <span className="text-white/60 text-xs line-through">
                        {formatPriceInUserCurrency(p.price, currency, locale)}
                      </span>
                      <span className="font-bold text-primary-on-dark text-sm">
                        {formatPriceInUserCurrency(getPriceAfterDiscount(Number(p.price)), currency, locale)}
                        <span className="ms-1.5 rtl:ms-0 rtl:me-1.5 text-[#28AC28] text-xs font-normal">
                          ({t("product.off", { percent: discountPercent })})
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-primary-on-dark text-sm">{formatPriceInUserCurrency(p.price, currency, locale)}</span>
                  )}
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-muted-on-dark text-center py-12 text-sm">{t("home.noProducts")}</p>
        )}
      </section>
    </div>
  );
}
