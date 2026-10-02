"use client";

/**
 * Language toggle (中文 / EN).
 * Compact pill used in the top navbar and the admin sidebar footer; flips
 * between the two shipped locales.
 */

import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export type LocaleSwitcherProps = {
  className?: string;
  /** Sidebar footer variant renders full width with the current label */
  fullWidth?: boolean;
  /** Icon-only variant for collapsed sidebars */
  iconOnly?: boolean;
};

export function LocaleSwitcher({
  className,
  fullWidth = false,
  iconOnly = false,
}: LocaleSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === "zh" ? "en" : "zh";
  const title =
    nextLocale === "en" ? t("Switch to English") : t("Switch to Chinese");

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/20 dark:border-white/10",
        "bg-white/50 dark:bg-white/5 px-3 text-xs text-gray-700 dark:text-gray-200",
        "backdrop-blur-md transition hover:bg-white/70 dark:hover:bg-white/10",
        fullWidth && "w-full",
        iconOnly && "w-8 px-0",
        className,
      )}
    >
      <Languages className="h-4 w-4 shrink-0" aria-hidden />
      {!iconOnly && <span>{locale === "zh" ? "中文" : "EN"}</span>}
    </button>
  );
}