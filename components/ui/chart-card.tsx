import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { SectionCardHeader } from "@/components/shared/SectionCardHeader";
import type { SectionHeaderTone } from "@/lib/ui/section-header-tones";

/**
 * Color variant types for chart cards
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "neutral";

interface ChartCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  description?: string;
  variant?: CardVariant;
}

/**
 * Color configuration for each variant - glassmorphic style
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
  // UI 简约化：统一白底 + 中性细边框，无彩色填充与发光
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
  neutral: {
    border: "border-slate-200 dark:border-slate-800",
    gradient: "bg-white dark:bg-slate-900",
    shadow: "",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-700",
  },
};

export function ChartCard({
  title,
  icon: Icon,
  children,
  className,
  description,
  variant = "neutral",
}: ChartCardProps) {
  const config = variantConfig[variant];

  return (
    <article
      className={cn(
        "group rounded-[20px] border backdrop-blur-md transition",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <SectionCardHeader
          title={title}
          description={description}
          icon={Icon}
          tone={variant as SectionHeaderTone}
        />
      </div>
      <div className="overflow-visible px-4 pb-4 sm:px-5 sm:pb-5 pt-1">{children}</div>
    </article>
  );
}
