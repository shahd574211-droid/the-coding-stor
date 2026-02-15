"use client";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline" | "link";
}) {
  const { locale, setLocale, isLocaleLoading } = useLocale();

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Language">
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={isLocaleLoading}
        className={`rounded-lg px-3 ${locale === "en" ? "ring-1 ring-white/30" : ""} ${className ?? ""}`}
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={isLocaleLoading}
        className={`rounded-lg px-3 ${locale === "ar" ? "ring-1 ring-white/30" : ""} ${className ?? ""}`}
        onClick={() => setLocale("ar")}
      >
        عربي
      </Button>
    </div>
  );
}
