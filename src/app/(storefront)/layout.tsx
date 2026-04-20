import Link from "next/link";
import Image from "next/image";
import DynamicBackground from "@/components/background/DynamicBackground";
import { Footer } from "@/components/footer";
import { StorefrontNav } from "@/components/storefront-nav";
import { getLocale } from "@/lib/i18n/server";
import { getCategories } from "@/server/actions/products";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const [categoriesResult, userResult] = await Promise.allSettled([
    getCategories(),
    getCurrentUser(),
  ]);
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const cartCount = 0;
  const user = userResult.status === "fulfilled" ? userResult.value : null;
  const isAdmin = user?.isAdmin ?? false;

  return (
    <DynamicBackground>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-[#FFE210] focus:px-4 focus:py-2 focus:text-black focus:outline-none focus:ring-2 focus:ring-white rtl:focus:left-auto rtl:focus:right-4"
      >
        Skip to content
      </a>
      <header className="glass-nav-on-dark sticky top-0 z-50 w-full border-b border-white/10">
        <div className="container flex h-14 items-center gap-4 px-4 max-w-6xl mx-auto">
          <StorefrontNav categories={categories} cartCount={cartCount} isAdmin={isAdmin} />
          <Link
            href="/"
            prefetch
            className="flex items-center gap-2.5 font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 logo-wrap shrink-0 order-last"
          >
            <Image
              src="/logos/logo.png"
              alt="the coding"
              width={390}
              height={132}
              quality={95}
              className="h-8 w-auto object-contain"
              sizes="120px"
              priority
            />
            <span className="text-[#FFE210] text-lg font-bold tracking-tight hidden sm:inline" aria-hidden>
              the coding
            </span>
          </Link>
        </div>
      </header>
      <main id="main" className="flex-1 container py-6 px-4 max-w-6xl mx-auto min-h-[60vh]">
        {children}
      </main>
      <Footer locale={locale} isAdmin={isAdmin} />
    </DynamicBackground>
  );
}
