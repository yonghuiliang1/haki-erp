/**
 * Locale configuration.
 * The app ships bilingual (zh default, en switchable). Chinese copy lives in
 * the message dictionaries keyed by the English source text, so any string
 * that has not been translated yet simply falls back to English.
 */

export type Locale = "zh" | "en";

/** Visitors and users without a stored preference get Chinese. */
export const DEFAULT_LOCALE: Locale = "zh";

/** Cookie that remembers the choice before sign-in (and across sessions). */
export const LOCALE_COOKIE = "haki_locale";

/** One year, in seconds. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : value === "zh" ? "zh" : DEFAULT_LOCALE;
}

/** BCP 47 tag for the <html lang> attribute. */
export function localeHtmlLang(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en";
}