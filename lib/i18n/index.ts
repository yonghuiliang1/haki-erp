/**
 * i18n public surface (pure utilities — safe on the server and in clients).
 *
 * - Client components: `import { useT } from "@/lib/i18n/locale-context"`
 * - Server components: `import { resolveLocale } from "@/lib/i18n/server"`
 *   then `createTranslator(locale)`.
 */

export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  normalizeLocale,
  localeHtmlLang,
  type Locale,
} from "./config";
export {
  translate,
  createTranslator,
  type TranslateFn,
  type TranslateVars,
} from "./translate";