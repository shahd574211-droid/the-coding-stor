import { cookies } from "next/headers";
import { defaultLocale, type Locale, messages, LOCALE_COOKIE } from "./messages";

export { LOCALE_COOKIE };

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value === "ar" || value === "en") return value;
  return defaultLocale;
}

export type Translations = Record<string, string>;

export function getTranslations(locale: Locale): Translations {
  return messages[locale] ?? messages[defaultLocale];
}

/** Replace {key} placeholders in a translation string. */
export function t(
  translations: Translations,
  key: string,
  params?: Record<string, string | number>
): string {
  let s = translations[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}
