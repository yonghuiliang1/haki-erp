/**
 * Statistics Card Component
 * Glassmorphism card component for displaying warehouse statistics
 * Supports light/dark mode with colored variants (sky, emerald, amber, rose)
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import { TYPO_STAT_VALUE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { useT } from "@/lib/i18n/locale-context";

/**
 * Color variant types for statistics cards
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal";

/**
 * Badge data structure
 */
interface BadgeData {
  label: string;
  value: string | number | React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Props for StatisticsCard component
 */
interface StatisticsCardProps {
  /**
   * Card title
   */
  title: string;
  /**
   * Main value to display (string, number, or hydration-safe client format node)
   */
  value: string | number | React.ReactNode;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;
  /**
   * Color variant for the card
   */
  variant?: CardVariant;
  /**
   * Array of badges to display below the value
   */
  badges?: BadgeData[];
  /**
   * Optional className for additional styling
   */
  className?: string;
  /**
   * When true, main value shows inline pulse (title/icon/description stay visible — REQ-0021)
   */
  valueLoading?: boolean;
  /**
   * When true, badge values pulse; badge labels remain visible
   */
  badgeValuesLoading?: boolean;
  /**
   * REQ-0171 — drop min-h-[210px] + tighter icon (forecast KPIs only)
   */
  compact?: boolean;
}

/**
 * Color configuration for each variant.
 * UI 简约化：卡片统一白底 + 中性细边框，无彩色填充与发光；variant 仅保留给潜在语义扩展。
 */
const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
  }
> = {
  sky: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
  emerald: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
  amber: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
  rose: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
  violet: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
  blue: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
  orange: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
  teal: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
};

/**
 * StatisticsCard component
 * Displays a glassmorphism card with statistics, icon, and badges
 */
export function StatisticsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "sky",
  badges = [],
  className,
  valueLoading = false,
  badgeValuesLoading = false,
  compact = false,
}: StatisticsCardProps) {
  const t = useT();
  const config = variantConfig[variant];
  const displayValue = valueLoading ? (
    <DataSlotPulse variant="metric" />
  ) : (
    value
  );

  return (
    <article
      className={cn(
        "group rounded-[28px] border h-full flex flex-col p-2 sm:p-4 backdrop-blur-md transition min-w-0 overflow-visible",
        // REQ-0171 — compact omits tall min-height (forecast KPIs)
        !compact && "min-h-[210px]",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full overflow-visible">
        {/* Title and icon inline so badges get full width below */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <p className="text-xs uppercase tracking-[0.45em] text-gray-700 dark:text-white/80 min-w-0">
            {title}
          </p>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 backdrop-blur dark:border-slate-700 dark:bg-slate-800",
              compact ? "h-8 w-8" : "h-10 w-10",
            )}
          >
            <Icon
              className={cn(
                "text-gray-700 dark:text-white",
                compact ? "h-4 w-4" : "h-5 w-5",
              )}
            />
          </div>
        </div>
        <p className={TYPO_STAT_VALUE}>{displayValue}</p>
        {description && (
          <p className={cn("mt-2", TYPO_SUBTITLE)}>{description}</p>
        )}
        {badges.length > 0 && (
          <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 overflow-visible">
            {/* REQ-0080 — neutral sub-badges; glass counters are section-title only (SectionCountBadge) */}
            {badges.map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant || "outline"}
                className="text-xs border-gray-300/50 bg-gray-100/80 text-gray-700 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-white/5 dark:text-white/80"
              >
                <span className="font-normal">{t(badge.label)}:</span>{" "}
                <span className="ml-1">
                  {badgeValuesLoading ? (
                    <DataSlotPulse variant="badge" />
                  ) : (
                    badge.value
                  )}
                </span>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
