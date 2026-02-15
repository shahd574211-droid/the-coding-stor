import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ShoppingCart, LogIn, LayoutDashboard } from "lucide-react";
import { getTranslations, t as tFn } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/messages";

const currentYear = new Date().getFullYear();

const quickLinks = [
  { href: "/products", labelKey: "footer.products", icon: ShoppingBag },
  { href: "/cart", labelKey: "footer.cart", icon: ShoppingCart },
  { href: "/login", labelKey: "footer.login", icon: LogIn },
  { href: "/admin", labelKey: "footer.admin", icon: LayoutDashboard },
];

export function Footer({ locale }: { locale: Locale }) {
  const translations = getTranslations(locale);
  const t = (key: string) => tFn(translations, key);

  return (
    <footer className="glass-footer-on-dark mt-auto">
      <div className="container py-8 px-4 max-w-6xl mx-auto" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-start">
          <Link
            href="/"
            prefetch
            className="inline-flex items-center gap-3 shrink-0 text-primary-on-dark hover:opacity-90 transition-opacity logo-wrap"
            aria-label="the coding — Home"
          >
            <Image
              src="/logos/footer-logo.png"
              alt=""
              width={224}
              height={224}
              quality={100}
              className="h-10 w-10 object-contain"
              sizes="40px"
            />
            <span className="text-sm font-medium hidden sm:inline">{t("footer.brand")}</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Footer quick links">
            {quickLinks.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-on-dark hover:text-primary-on-dark hover:bg-white/10 transition-all duration-200"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(labelKey)}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-muted-on-dark text-center mt-6">
          {t("footer.tagline")} · © {currentYear} {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
