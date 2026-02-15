"use client";

import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { messages, type Locale } from "@/lib/i18n/messages";
import { setLocaleAction } from "@/lib/i18n/actions";

type Translations = Record<string, string>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  isLocaleLoading: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLocaleLoading, setIsLocaleLoading] = useState(false);

  const setLocale = useCallback(
    async (locale: Locale) => {
      if (locale === initialLocale) return;
      setIsLocaleLoading(true);
      try {
        await setLocaleAction(locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        router.refresh();
      } finally {
        setIsLocaleLoading(false);
      }
    },
    [router, initialLocale]
  );
  const translations = useMemo(
    () => (messages[initialLocale] ?? messages.en) as Translations,
    [initialLocale]
  );
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let s = translations[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return s;
    },
    [translations]
  );
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: initialLocale,
      setLocale,
      t,
      dir: initialLocale === "ar" ? "rtl" : "ltr",
      isLocaleLoading,
    }),
    [initialLocale, setLocale, t, isLocaleLoading]
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
