"use client";

import React, { type ReactNode } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { DataSlotPulse } from "@/components/shared";
import { useT } from "@/lib/i18n/locale-context";

export type DeferredChartSectionProps = {
  /** Data slot still loading (SSR or TanStack fetch) */
  loading?: boolean;
  /** Chart has at least one data point */
  hasData: boolean;
  emptyMessage?: ReactNode;
  pulseClassName?: string;
  children: ReactNode;
};

/**
 * REQ-0026 — shared Recharts hydration gate for portal/dashboard pages.
 * Shows DataSlotPulse until client mount + data ready; prevents SSR/DOM mismatch.
 */
export function DeferredChartSection({
  loading = false,
  hasData,
  emptyMessage,
  pulseClassName = "min-h-[240px]",
  children,
}: DeferredChartSectionProps) {
  const t = useT();
  const mounted = useMounted();

  if (loading || !mounted) {
    return <DataSlotPulse variant="chart" className={pulseClassName} />;
  }

  if (!hasData) {
    if (emptyMessage) return <>{emptyMessage}</>;
    return (
      <p className="text-muted-foreground text-center py-8">{t("No data yet")}</p>
    );
  }

  return <>{children}</>;
}
