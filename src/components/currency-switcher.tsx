"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Banknote } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { setCurrencyAction } from "@/lib/currency/actions";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function CurrencySwitcher({
  currentCurrency,
  className,
}: {
  currentCurrency: CurrencyCode;
  className?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(currentCurrency);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrency(currentCurrency);
  }, [currentCurrency]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function selectCurrency(code: CurrencyCode) {
    if (code === currency) {
      setOpen(false);
      return;
    }
    await setCurrencyAction(code);
    setCurrency(code);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className={`relative ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("currency.label")}
      >
        <Banknote className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{currency}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full end-0 rtl:end-auto rtl:start-0 mt-1 min-w-[7rem] rounded-xl border border-white/20 bg-black/90 py-1 shadow-xl z-50"
          aria-label={t("currency.label")}
        >
          {CURRENCIES.map(({ code, labelKey }) => (
            <li key={code} role="option" aria-selected={currency === code}>
              <button
                type="button"
                onClick={() => selectCurrency(code)}
                className={`w-full text-start px-4 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors ${
                  currency === code
                    ? "bg-[#28AC28]/30 text-[#28AC28]"
                    : "text-white/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                <span>{t(labelKey)}</span>
                {currency === code && (
                  <span className="ms-auto rtl:ms-0 rtl:me-auto text-xs" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
