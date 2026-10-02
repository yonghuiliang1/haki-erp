"use client";

/**
 * Forecasting Section Component
 * Displays demand forecasting, stock predictions, and anomalies.
 * REQ-0170 — StatisticsCard KPIs; ChartCard section headers; ProductThumb + sky links.
 * REQ-0171 — compact KPIs; denser Product cell.
 * REQ-0172 — 2-line Name·SKU / Category·supplier AvatarInlineLink; table overflow-x only.
 * REQ-0173 — DenseCatalogProductCell shared with Top Products.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import { DenseCatalogProductCell } from "@/components/shared/DenseCatalogProductCell";
import { ChartCard } from "@/components/ui/chart-card";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { useForecastingSummary } from "@/hooks/queries";
import {
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { PAGE_STATS_GRID_IN_SHELL_CLASS } from "@/lib/ui/shell-layout-styles";
import { useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type {
  ForecastingSummary,
  ProductDemandForecast,
  SalesAnomaly,
} from "@/types";

/**
 * Distinct colors for Status badges: normal=green, urgent=red, soon=amber, overstocked=slate
 */
function getStatusBadgeClassName(
  recommendation: ProductDemandForecast["reorderRecommendation"],
): string {
  switch (recommendation) {
    case "urgent":
      return "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300 dark:bg-red-500/20 dark:border-red-400/40";
    case "soon":
      return "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-400/40";
    case "overstocked":
      return "border-slate-400/40 bg-slate-500/15 text-slate-700 dark:text-slate-300 dark:bg-slate-500/20 dark:border-slate-400/40";
    case "normal":
    default:
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-400/40";
  }
}

/**
 * Distinct colors for anomaly type: spike=red, dip=amber
 */
function getAnomalyTypeBadgeClassName(anomalyType: string): string {
  if (anomalyType === "spike") {
    return "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300 dark:bg-red-500/20 dark:border-red-400/40";
  }
  return "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-400/40";
}

/**
 * Get anomaly severity color
 */
function getAnomalySeverityColor(severity: SalesAnomaly["severity"]): string {
  switch (severity) {
    case "high":
      return "text-red-600 dark:text-red-400";
    case "medium":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-yellow-600 dark:text-yellow-400";
  }
}

export type ForecastingSectionProps = {
  /** SSR-passed forecast summary (REQ-0025) */
  initialForecasting?: ForecastingSummary;
};

export default function ForecastingSection({
  initialForecasting,
}: ForecastingSectionProps = {}) {
  const t = useT();
  const forecastingQuery = useForecastingSummary(initialForecasting);
  const summary = forecastingQuery.data ?? initialForecasting;
  const dataLoading = isDataSlotUnsettled(forecastingQuery, initialForecasting);

  useSyncSsrQueryData(queryKeys.forecasting.summary(), initialForecasting);

  if (!dataLoading && (forecastingQuery.isError || !summary)) {
    return (
      <ChartCard
        variant="rose"
        title={t("Demand Forecasting")}
        icon={AlertTriangle}
        description={t("Unable to load forecasting data")}
      >
        <p className="text-muted-foreground text-center text-gray-700 dark:text-white py-4">
          {t("Failed to load forecasting data")}
        </p>
      </ChartCard>
    );
  }

  const urgentProducts =
    summary?.forecasts.filter((f) => f.reorderRecommendation === "urgent") ??
    [];
  const soonProducts =
    summary?.forecasts.filter((f) => f.reorderRecommendation === "soon") ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* REQ-0170 — StatisticsCard KPIs (single card padding; no nested CardHeader p-4) */}
      <div
        className={cn(
          PAGE_STATS_GRID_IN_SHELL_CLASS,
          "grid-cols-2 md:grid-cols-4",
        )}
      >
        <StatisticsCard
          title={t("Products Analyzed")}
          value={summary?.totalProducts ?? 0}
          icon={Package}
          variant="blue"
          valueLoading={dataLoading}
          compact
        />
        <StatisticsCard
          title={t("At Risk of Stockout")}
          value={summary?.productsAtRisk ?? 0}
          icon={AlertTriangle}
          variant="rose"
          valueLoading={dataLoading}
          compact
        />
        <StatisticsCard
          title={t("Overstocked")}
          value={summary?.productsOverstocked ?? 0}
          icon={TrendingDown}
          variant="orange"
          valueLoading={dataLoading}
          compact
        />
        <StatisticsCard
          title={t("Anomalies Detected")}
          value={summary?.anomaliesDetected ?? 0}
          icon={AlertCircle}
          variant="violet"
          valueLoading={dataLoading}
          compact
        />
      </div>

      {dataLoading ? (
        <ChartCard
          variant="violet"
          title={t("AI Insights")}
          icon={Sparkles}
          description={t("Natural-language summary of demand and stock risk")}
        >
          <DataSlotPulse variant="text-sm" className="w-full min-h-[4rem]" />
        </ChartCard>
      ) : summary?.aiInsights ? (
        <ChartCard
          variant="violet"
          title={t("AI Insights")}
          icon={Sparkles}
          description={t("Natural-language summary of demand and stock risk")}
        >
          <p className="text-sm text-gray-600 dark:text-white/80 whitespace-pre-line">
            {summary.aiInsights}
          </p>
        </ChartCard>
      ) : null}

      {dataLoading ? (
        <ChartCard
          variant="rose"
          title={t("Reorder Recommendations")}
          icon={Clock}
          description={t(
            "Products that need attention based on predicted stockout dates",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Product")}</TableHead>
                <TableHead className="text-right">{t("Available")}</TableHead>
                <TableHead className="text-right">{t("Daily Sales")}</TableHead>
                <TableHead className="text-right">{t("Days Left")}</TableHead>
                <TableHead className="text-right">
                  {t("Suggested Order")}
                </TableHead>
                <TableHead>{t("Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBodyPulseRows rows={5} columnCount={6} />
          </Table>
        </ChartCard>
      ) : urgentProducts.length > 0 || soonProducts.length > 0 ? (
        <ChartCard
          variant="rose"
          title={t("Reorder Recommendations")}
          icon={Clock}
          description={t(
            "Products that need attention based on predicted stockout dates",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Product")}</TableHead>
                <TableHead className="text-right">{t("Available")}</TableHead>
                <TableHead className="text-right">{t("Daily Sales")}</TableHead>
                <TableHead className="text-right">{t("Days Left")}</TableHead>
                <TableHead className="text-right">
                  {t("Suggested Order")}
                </TableHead>
                <TableHead>{t("Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...urgentProducts, ...soonProducts]
                .slice(0, 10)
                .map((forecast) => (
                  <TableRow key={forecast.productId}>
                    <TableCell>
                      <DenseCatalogProductCell
                        productId={forecast.productId}
                        productName={forecast.productName}
                        sku={forecast.sku}
                        imageUrl={forecast.imageUrl}
                        categoryId={forecast.categoryId}
                        categoryName={forecast.categoryName}
                        supplierId={forecast.supplierId}
                        supplierName={forecast.supplierName}
                        supplierImage={forecast.supplierImage}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {forecast.availableStock}
                    </TableCell>
                    <TableCell className="text-right">
                      {forecast.predictedDailySales.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {forecast.daysUntilStockout ?? "∞"}
                    </TableCell>
                    <TableCell className="text-right">
                      {forecast.suggestedReorderQuantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClassName(
                          forecast.reorderRecommendation,
                        )}
                      >
                        {forecast.reorderRecommendation}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ChartCard>
      ) : null}

      {dataLoading ? (
        <ChartCard
          variant="violet"
          title={t("Sales Anomalies")}
          icon={TrendingUp}
          description={t(
            "Unusual sales patterns detected in the last 30 days",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Product")}</TableHead>
                <TableHead>{t("Date")}</TableHead>
                <TableHead className="text-right">{t("Expected")}</TableHead>
                <TableHead className="text-right">{t("Actual")}</TableHead>
                <TableHead className="text-right">{t("Deviation")}</TableHead>
                <TableHead>{t("Type")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBodyPulseRows rows={5} columnCount={6} />
          </Table>
        </ChartCard>
      ) : (summary?.anomalies.length ?? 0) > 0 ? (
        <ChartCard
          variant="violet"
          title={t("Sales Anomalies")}
          icon={TrendingUp}
          description={t(
            "Unusual sales patterns detected in the last 30 days",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Product")}</TableHead>
                <TableHead>{t("Date")}</TableHead>
                <TableHead className="text-right">{t("Expected")}</TableHead>
                <TableHead className="text-right">{t("Actual")}</TableHead>
                <TableHead className="text-right">{t("Deviation")}</TableHead>
                <TableHead>{t("Type")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary!.anomalies.slice(0, 10).map((anomaly, idx) => (
                <TableRow key={`${anomaly.productId}-${anomaly.date}-${idx}`}>
                  <TableCell>
                      <DenseCatalogProductCell
                        productId={anomaly.productId}
                        productName={anomaly.productName}
                        sku={anomaly.sku}
                        imageUrl={anomaly.imageUrl}
                        categoryId={anomaly.categoryId}
                        categoryName={anomaly.categoryName}
                        supplierId={anomaly.supplierId}
                        supplierName={anomaly.supplierName}
                        supplierImage={anomaly.supplierImage}
                      />
                  </TableCell>
                  <TableCell>{anomaly.date}</TableCell>
                  <TableCell className="text-right">
                    {anomaly.expectedQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {anomaly.actualQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={getAnomalySeverityColor(anomaly.severity)}>
                      {anomaly.deviation > 0 ? "+" : ""}
                      {anomaly.deviation}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getAnomalyTypeBadgeClassName(
                        anomaly.anomalyType,
                      )}
                    >
                      {anomaly.anomalyType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>
      ) : null}

      <ChartCard
        variant="emerald"
        title={t("All Product Forecasts")}
        icon={Package}
        description={t(
          "Demand predictions and stock levels for all products (sorted by urgency)",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Product")}</TableHead>
              <TableHead className="text-right">{t("Current")}</TableHead>
              <TableHead className="text-right">{t("Available")}</TableHead>
              <TableHead className="text-right">{t("Avg Daily")}</TableHead>
              <TableHead className="text-right">{t("Predicted")}</TableHead>
              <TableHead className="text-right">{t("Days Left")}</TableHead>
              <TableHead className="text-right">{t("Confidence")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
            </TableRow>
          </TableHeader>
          {dataLoading ? (
            <TableBodyPulseRows rows={10} columnCount={8} />
          ) : (
            <TableBody>
              {(summary?.forecasts ?? []).slice(0, 20).map((forecast) => (
                <TableRow key={forecast.productId}>
                  <TableCell>
                    <DenseCatalogProductCell
                      productId={forecast.productId}
                      productName={forecast.productName}
                      sku={forecast.sku}
                      imageUrl={forecast.imageUrl}
                      categoryId={forecast.categoryId}
                      categoryName={forecast.categoryName}
                      supplierId={forecast.supplierId}
                      supplierName={forecast.supplierName}
                      supplierImage={forecast.supplierImage}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {forecast.currentStock}
                  </TableCell>
                  <TableCell className="text-right">
                    {forecast.availableStock}
                  </TableCell>
                  <TableCell className="text-right">
                    {forecast.averageDailySales.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    {forecast.predictedDailySales.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    {forecast.daysUntilStockout ?? "∞"}
                  </TableCell>
                  <TableCell className="text-right">
                    {forecast.confidenceScore}%
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeClassName(
                        forecast.reorderRecommendation,
                      )}
                    >
                      {forecast.reorderRecommendation}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </ChartCard>
    </div>
  );
}
