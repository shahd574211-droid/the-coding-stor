import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/server/actions/products";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPriceInUserCurrency } from "@/lib/currency";
import Image from "next/image";
import { ShoppingCart, Download } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { getTranslations, t as tFn } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/currency/server";
import { getGlobalDiscountPercent, getPriceAfterDiscount } from "@/lib/discount";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [locale, currency, product] = await Promise.all([
    getLocale(),
    getCurrency(),
    getProductBySlug(slug),
  ]);
  if (!product) notFound();

  const translations = getTranslations(locale);
  const t = (key: string, params?: Record<string, string | number>) => tFn(translations, key, params);
  const isDigital = product.type === "DIGITAL";
  const discountPercent = getGlobalDiscountPercent();
  const priceNum = Number(product.price);

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <nav className="text-sm text-muted-on-dark flex flex-wrap items-center gap-1.5 rtl:flex-row-reverse rtl:justify-end" aria-label="Breadcrumb">
        <Link href="/products" prefetch className="hover:text-primary-on-dark transition-colors text-white/90">{t("nav.products")}</Link>
        {product.category && (
          <>
            <span aria-hidden className="opacity-60">/</span>
            <Link href={`/products?category=${product.category.slug}`} prefetch className="hover:text-primary-on-dark transition-colors text-white/90">
              {product.category.name}
            </Link>
          </>
        )}
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-on-dark font-medium">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square relative bg-black/30 rounded-2xl overflow-hidden glass-card-on-dark border border-white/20 shadow-xl order-1 rtl:md:order-2">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-on-dark">
              {t("products.noImage")}
            </div>
          )}
        </div>

        <Card className="glass-card-on-dark border-white/20 h-fit order-2 rtl:md:order-1">
          <CardHeader className="space-y-2 text-start">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-on-dark">{product.name}</h1>
            {product.category && (
              <p className="text-muted-on-dark">{product.category.name}</p>
            )}
            <div className="space-y-0.5">
              {discountPercent > 0 ? (
                <>
                  <p className="text-lg text-white/60 line-through">
                    {formatPriceInUserCurrency(product.price, currency, locale)}
                  </p>
                  <p className="text-2xl font-bold text-primary-on-dark">
                    {formatPriceInUserCurrency(getPriceAfterDiscount(priceNum), currency, locale)}
                    <span className="ms-2 rtl:ms-0 rtl:me-2 text-[#28AC28] text-base font-normal">
                      ({t("product.off", { percent: discountPercent })})
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold text-primary-on-dark">
                  {formatPriceInUserCurrency(product.price, currency, locale)}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-start">
            {product.shortDescription && (
              <p className="text-muted-on-dark leading-relaxed">{product.shortDescription}</p>
            )}
            {product.description && (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-on-dark/90 text-start">
                {product.description}
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-4 rtl:flex-row-reverse">
              <Button asChild className="rounded-xl">
                <Link href={`/cart?add=${product.id}`} prefetch className="inline-flex items-center">
                  <ShoppingCart className="h-4 w-4 me-2" />
                  {t("product.addToCart")}
                </Link>
              </Button>
              {isDigital && (
                <Button variant="outline" disabled className="rounded-xl glass-on-dark border-white/20 text-white/70 inline-flex items-center">
                  <Download className="h-4 w-4 me-2" />
                  {t("product.downloadAfterPurchase")}
                </Button>
              )}
            </div>
            {product.stock != null && product.type === "PHYSICAL" && (
              <p className="text-sm text-muted-on-dark">
                {t("product.inStock", { count: product.stock })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
