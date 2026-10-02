"use client";

/**
 * Locale provider + hooks.
 * Switching writes the cookie immediately (works signed-out) and syncs the
 * signed-in user's profile in the background so the choice follows the account.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  normalizeLocale,
  type Locale,
} from "./config";
import { translate, type TranslateFn, type TranslateVars } from "./translate";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    normalizeLocale(initialLocale),
  );

  const setLocale = useCallback((next: Locale) => {
    const normalized = normalizeLocale(next);
    setLocaleState(normalized);
    // Cookie first: instant for anonymous visitors and on next SSR.
    Cookies.set(LOCALE_COOKIE, normalized, {
      expires: LOCALE_COOKIE_MAX_AGE / 86400,
      sameSite: "lax",
      path: "/",
    });
    // Profile sync is best-effort; signed-out visitors simply get a 401.
    fetch("/api/user/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: normalized }),
    }).catch(() => {});
  }, []);

  const t = useCallback<TranslateFn>(
    (text: string, vars?: TranslateVars) => translate(locale, text, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/** Fallback so a component rendered outside the provider never crashes. */
const FALLBACK_VALUE: LocaleContextValue = {
  locale: "zh",
  setLocale: () => {},
  t: (text) => translate("zh", text),
};

/** Full locale context (current locale, setter, translator). */
export function useI18n(): LocaleContextValue {
  return useContext(LocaleContext) ?? FALLBACK_VALUE;
}

/** Translator only — the common case inside components. */
export function useT(): TranslateFn {
  return useI18n().t;
}