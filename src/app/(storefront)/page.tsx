import Link from "next/link";
import { getPublishedProducts } from "@/server/actions/products";
import { FavoriteButton } from "@/components/favorite-button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPriceInUserCurrency } from "@/lib/currency";
import Image from "next/image";
import { getLocale } from "@/lib/i18n/server";
import { getTranslations, t as tFn } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/currency/server";
import { getGlobalDiscountPercent, getPriceAfterDiscount } from "@/lib/discount";
import { HeroCarousel } from "@/components/hero-carousel";

export default async function HomePage() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const productsResult = await getPublishedProducts({ limit: 8 }).catch(() => ({
    products: [],
    total: 0,
  }));
  const { products } = productsResult;
  const translations = getTranslations(locale);
  const t = (key: string, params?: Record<string, string | number>) => tFn(translations, key, params);
  const discountPercent = getGlobalDiscountPercent();

  return (
    <div className="space-y-10">
      {/* قسم البطل: كورسول يسار، النص يمين */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start py-8 lg:py-10 text-start rtl:text-end">
        {/* كورسول الصور — يسار في كلا الاتجاهين */}
        <div className="order-1 rtl:order-2">
          <HeroCarousel
            images={[
              { src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=85", alt: "متجر" },
              { src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=85", alt: "تسوق" },
              { src: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=85", alt: "عروض" },
              { src: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=900&q=85", alt: "تشكيلة منتجات" },
            ]}
          />
        </div>
        {/* نص الهيرو — جملة واحدة منسقة */}
        <div className="order-2 rtl:order-1 flex flex-col gap-3 rtl:text-right text-start max-w-lg pt-2 lg:pt-4">
          <p className="hero-subtitle">
            {t("home.hero.subtitle")}
          </p>
          <p className="hero-body">
            {t("home.hero.body")}
          </p>
        </div>
      </section>

      <section className="space-y-6 text-start">
        <div className="flex items-center justify-between flex-wrap gap-3 rtl:flex-row-reverse">
          <h2 className="text-xl font-semibold text-primary-on-dark">{t("home.featured")}</h2>
          <Link href="/products" prefetch>
            <span className="inline-flex items-center rounded-xl bg-[#28AC28] px-5 py-2.5 text-base font-medium text-white hover:opacity-90 transition-opacity shadow-lg">
              {t("home.viewAll")}
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p) => {
            const prod = p as typeof p & { category?: { name: string } };
            return (
                <Card key={p.id} className="relative overflow-hidden group glass-card-on-dark border-white/20 rounded-2xl transition-all duration-200 hover:border-white/30 hover:shadow-xl">
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
                  <h3 className="font-semibold line-clamp-2 text-on-dark text-base">{p.name}</h3>
                  {prod.category && (
                    <p className="text-sm text-muted-on-dark mt-1">{prod.category.name}</p>
                  )}
                </CardContent>
                </Link>
                <CardFooter className="p-4 pt-0 flex flex-col items-start gap-2">
                  <div className="flex flex-col gap-1">
                    {discountPercent > 0 ? (
                      <>
                        <span className="text-white/60 text-sm line-through">
                          {formatPriceInUserCurrency(p.price, currency, locale)}
                        </span>
                        <span className="font-bold text-primary-on-dark text-base">
                          {formatPriceInUserCurrency(getPriceAfterDiscount(Number(p.price)), currency, locale)}
                          <span className="ms-1.5 rtl:ms-0 rtl:me-1.5 text-[#28AC28] text-sm font-normal">
                            ({t("product.off", { percent: discountPercent })})
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-primary-on-dark text-base">{formatPriceInUserCurrency(p.price, currency, locale)}</span>
                    )}
                  </div>
                  <AddToCartButton productId={p.id} variant="accent" size="sm" className="rounded-xl w-full sm:w-auto" />
                </CardFooter>
                <FavoriteButton productId={p.id} size="sm" />
              </Card>
            );
          })}
        </div>
        {products.length === 0 && (
          <p className="text-muted-on-dark text-center py-12 text-base">{t("home.noProducts")}</p>
        )}
      </section>
    </div>
  );
}
