import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getLocale } from "@/lib/i18n/server";
import { getTranslations, t as tFn } from "@/lib/i18n/server";

export default async function CartPage() {
  const locale = await getLocale();
  const translations = getTranslations(locale);
  const t = (key: string) => tFn(translations, key);

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-start" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-on-dark">{t("cart.title")}</h1>
      <Card className="glass-card-on-dark border-white/20">
        <CardHeader className="space-y-2">
          <h2 className="text-xl font-semibold text-primary-on-dark">{t("cart.empty")}</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-on-dark leading-relaxed">
            {t("cart.emptyHint")}
          </p>
          <Link href="/products">
            <Button variant="accent" className="rounded-xl">{t("cart.continueShopping")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
