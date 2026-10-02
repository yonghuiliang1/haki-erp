/**
 * Pure translation lookup — usable on the server and in client components.
 * Keys are the English source strings; missing entries fall back to the
 * English text so partial coverage never breaks a screen.
 */

import { type Locale } from "./config";
import { ZH_MESSAGES } from "./messages";

export type TranslateVars = Record<string, string | number>;

export type TranslateFn = (text: string, vars?: TranslateVars) => string;

/** Replace {name} placeholders with the provided values. */
export function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(String(value));
  }
  return out;
}

export function translate(
  locale: Locale,
  text: string,
  vars?: TranslateVars,
): string {
  const dict = locale === "zh" ? ZH_MESSAGES : null;
  const base = dict?.[text] ?? text;
  return interpolate(base, vars);
}

/** Bind a locale once and reuse the translator (server components). */
export function createTranslator(locale: Locale): TranslateFn {
  return (text, vars) => translate(locale, text, vars);
}