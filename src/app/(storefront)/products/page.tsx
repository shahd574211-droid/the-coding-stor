import { getPublishedProducts, getCategories } from "@/server/actions/products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPriceInUserCurrency } from "@/lib/currency";
import Link from "next/link";
import Image from "next/image";
import { getLocale } from "@/lib/i18n/server";
import { getTranslations, t as tFn } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/currency/server";
import { getGlobalDiscountPercent, getPriceAfterDiscount } from "@/lib/discount";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? undefined;
  const page = Number(params.page) || 1;
  const limit = 24;
  const offset = (page - 1) * limit;

  const [locale, currency, { products, total }, categories] = await Promise.all([
    getLocale(),
    getCurrency(),
    getPublishedProducts({ categorySlug: category, limit, offset }),
    getCategories(),
  ]);
  const translations = getTranslations(locale);
  const t = (key: string, params?: Record<string, string | number>) => tFn(translations, key, params);
  const discountPercent = getGlobalDiscountPercent();

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 text-start" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="text-xl md:text-2xl font-bold text-primary-on-dark">{t("products.title")}</h1>

      {categories.length > 0 && (
        <nav className="flex flex-wrap gap-2 rtl:flex-row-reverse rtl:justify-end" aria-label="Categories">
          <Link href="/products" prefetch>
            <span
              className={
                !category
                  ? "inline-flex rounded-xl bg-[#404079] px-4 py-2 text-sm font-medium text-white shadow-md"
                  : "inline-flex rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-all duration-200"
              }
            >
              {t("products.all")}
            </span>
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} prefetch>
              <span
                className={
                  category === c.slug
                    ? "inline-flex rounded-xl bg-[#404079] px-4 py-2 text-sm font-medium text-white shadow-md"
                    : "inline-flex rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-all duration-200"
                }
              >
                {c.name}
              </span>
            </Link>
          ))}
        </nav>
      )}

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
                <h2 className="font-semibold line-clamp-2 text-on-dark text-sm">{p.name}</h2>
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

      {total === 0 && (
        <p className="text-muted-on-dark text-center py-12 text-sm">{t("products.noProducts")}</p>
      )}

      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-2 flex-wrap pt-4 rtl:flex-row-reverse" aria-label="Pagination">
          {page > 1 && (
            <Link href={`/products?${new URLSearchParams({ ...params, page: String(page - 1) })}`} prefetch>
              <span className="inline-flex rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-all duration-200">{t("products.previous")}</span>
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-muted-on-dark font-medium">
            {t("products.pageOf", { page: String(page), total: String(totalPages) })}
          </span>
          {page < totalPages && (
            <Link href={`/products?${new URLSearchParams({ ...params, page: String(page + 1) })}`} prefetch>
              <span className="inline-flex rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-all duration-200">{t("products.next")}</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
