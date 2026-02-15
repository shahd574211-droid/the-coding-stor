"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Package, LogIn, LayoutDashboard, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/components/locale-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { Session } from "@supabase/supabase-js";
import { CurrencySwitcher } from "@/components/currency-switcher";
import type { CurrencyCode } from "@/lib/currency";

const baseNavItems = [
  { href: "/products", labelKey: "nav.products", icon: Package },
  { href: "/cart", labelKey: "nav.cartAria", icon: ShoppingCart },
];

const loginNavItem = { href: "/login", labelKey: "nav.login", icon: LogIn };
const accountNavItem = { href: "/", labelKey: "nav.myAccount", icon: User };

export function StorefrontNav({ initialCurrency = "IQD" }: { initialCurrency?: CurrencyCode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  const navItems = [
    ...baseNavItems,
    ...(session ? [accountNavItem] : [loginNavItem]),
    { href: "/admin", labelKey: "nav.admin", icon: LayoutDashboard },
  ];

  return (
    <nav className="flex items-center gap-1 rtl:flex-row-reverse" aria-label="Main">
      {navItems.map(({ href, labelKey, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : href === "/products"
              ? pathname === "/products" || pathname.startsWith("/products/")
              : href === "/admin"
                ? pathname.startsWith("/admin")
                : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className={`nav-link inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white ${active ? "nav-link-active bg-white/15" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t(labelKey)}</span>
          </Link>
        );
      })}
      {mounted && session && (
        <button
          type="button"
          onClick={handleLogout}
          className="nav-link inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white"
          aria-label={t("nav.logout")}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{t("nav.logout")}</span>
        </button>
      )}
      <div className="ms-1 rtl:ms-0 rtl:me-1 flex items-center gap-0.5 border-s border-white/20 rtl:border-s-0 rtl:border-e ps-1 rtl:ps-0 rtl:pe-1 [&_button]:text-white/90 [&_button]:hover:text-white [&_button]:hover:bg-white/15">
        <CurrencySwitcher currentCurrency={initialCurrency} />
        <LanguageSwitcher variant="ghost" />
        <ThemeToggle variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-white/90 hover:bg-white/15 hover:text-white" />
      </div>
    </nav>
  );
}
