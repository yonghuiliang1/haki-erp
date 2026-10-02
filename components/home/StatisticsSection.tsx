/**
 * Statistics Section — store-wide KPI cards (REQ-0021 shell-first).
 * Card titles/icons always visible; only values pulse while dashboard loads.
 */

"use client";

import React from "react";
import {
  Package,
  FolderTree,
  Truck,
  DollarSign,
  ShoppingCart,
  FileText,
  Warehouse,
} from "lucide-react";
import { StatisticsCard } from "./StatisticsCard";
import { useDashboard } from "@/hooks/queries/use-dashboard";
import {
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { buildStoreOrderStatusBadges } from "@/lib/ui/store-order-status-badges";
import { buildStoreInvoiceStatusBadges } from "@/lib/ui/store-invoice-status-badges";
import { useAuth } from "@/contexts";
import type { DashboardStats } from "@/types";
import { formatStableCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";

const formatCurrency = formatStableCurrency;

export type StatisticsSectionProps = {
  /** SSR-passed dashboard stats for first-render hydration */
  initialStats?: DashboardStats | null;
};

export function StatisticsSection({
  initialStats,
}: StatisticsSectionProps = {}) {
  const t = useT();
  const { user } = useAuth();
  const dashboardQuery = useDashboard(initialStats ?? undefined);
  const stats = dashboardQuery.data ?? initialStats ?? null;
  const dataLoading = isDataSlotUnsettled(dashboardQuery, initialStats);

  useSyncSsrQueryData(
    queryKeys.dashboard.overview(user?.id ?? ""),
    user?.id && initialStats != null ? initialStats : undefined,
  );

  const revenueFromOrders =
    stats?.orderAnalytics?.totalRevenueExcludingCancelled ??
    stats?.revenue?.fromOrders ??
    0;
  const selfOthers = stats?.selfOthersBreakdown;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch">
      <StatisticsCard
        title={t("Total Products")}
        value={stats?.counts?.products ?? 0}
        description={t("Products availability")}
        icon={Package}
        variant="rose"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={[
          {
            label: t("Available"),
            value: stats?.productStatusBreakdown?.available ?? 0,
          },
          {
            label: t("Stock low"),
            value: stats?.productStatusBreakdown?.stockLow ?? 0,
          },
          {
            label: t("Stock out"),
            value: stats?.productStatusBreakdown?.stockOut ?? 0,
          },
        ]}
      />
      <StatisticsCard
        title={t("Total Value")}
        value={formatCurrency(stats?.totalInventoryValue ?? 0)}
        description={t("Total inventory value")}
        icon={DollarSign}
        variant="violet"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={[
          {
            label: t("Orders"),
            value: formatCurrency(
              stats?.orderAnalytics?.totalRevenueExcludingCancelled ??
                stats?.revenue?.fromOrders ??
                0,
            ),
          },
          {
            label: t("Invoices"),
            value: formatCurrency(stats?.revenue?.fromInvoices ?? 0),
          },
          {
            label: t("Due"),
            value: formatCurrency(
              stats?.invoiceAnalytics?.outstandingAmount ?? 0,
            ),
          },
          {
            label: t("Cancelled"),
            value: formatCurrency(
              stats?.orderAnalytics?.cancelledOrderAmount ?? 0,
            ),
          },
        ]}
      />
      <StatisticsCard
        title={t("Total Revenue")}
        value={formatCurrency(revenueFromOrders)}
        description={t("Profits (excl. cancelled)")}
        icon={DollarSign}
        variant="emerald"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={[
          {
            label: t("Paid"),
            value: formatCurrency(stats?.orderAnalytics?.paidOrderAmount ?? 0),
          },
          {
            label: t("Partial"),
            value: formatCurrency(
              stats?.orderAnalytics?.partialOrderAmount ?? 0,
            ),
          },
          {
            label: t("Due"),
            value: formatCurrency(
              stats?.invoiceAnalytics?.outstandingAmount ?? 0,
            ),
          },
          {
            label: t("Refund"),
            value: formatCurrency(stats?.orderAnalytics?.refundedAmount ?? 0),
          },
          {
            label: t("Pending"),
            value: formatCurrency(
              stats?.orderAnalytics?.pendingOrderAmount ?? 0,
            ),
          },
          ...(selfOthers
            ? [
                {
                  label: t("Self"),
                  value: formatCurrency(selfOthers.revenueSelf),
                },
                {
                  label: t("Others"),
                  value: formatCurrency(selfOthers.revenueOthers),
                },
              ]
            : []),
        ]}
      />
      <StatisticsCard
        title={t("Total Orders")}
        value={stats?.counts?.orders ?? 0}
        description={t("Total orders placed (self + client)")}
        icon={ShoppingCart}
        variant="blue"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={buildStoreOrderStatusBadges({
          statusDistribution: stats?.orderAnalytics?.statusDistribution,
          refundedCount: stats?.orderAnalytics?.refundedCount,
          selfOthers: selfOthers
            ? {
                orderSelfCount: selfOthers.orderSelfCount,
                orderOthersCount: selfOthers.orderOthersCount,
              }
            : null,
        })}
      />
      <StatisticsCard
        title={t("Invoices")}
        value={stats?.counts?.invoices ?? 0}
        description={t("Total invoices (store-wide)")}
        icon={FileText}
        variant="sky"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={buildStoreInvoiceStatusBadges({
          paidCount: stats?.invoiceAnalytics?.statusDistribution?.paid,
          partialCount: stats?.invoiceAnalytics?.partialCount,
          pendingCount:
            stats?.invoiceAnalytics?.pendingCount ??
            (stats?.invoiceAnalytics?.statusDistribution?.draft ?? 0) +
              (stats?.invoiceAnalytics?.statusDistribution?.sent ?? 0),
          overdueCount: stats?.invoiceAnalytics?.statusDistribution?.overdue,
          cancelledCount:
            stats?.invoiceAnalytics?.statusDistribution?.cancelled,
          refundedCount: stats?.orderAnalytics?.refundedCount,
          selfOthers: selfOthers
            ? {
                invoiceSelfCount: selfOthers.invoiceSelfCount,
                invoiceOthersCount: selfOthers.invoiceOthersCount,
              }
            : null,
        })}
      />
      <StatisticsCard
        title={t("Total Warehouses")}
        value={stats?.counts?.warehouses ?? 0}
        description={t("Storage locations")}
        icon={Warehouse}
        variant="teal"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={[
          {
            label: t("Active"),
            value: stats?.warehouseAnalytics?.activeWarehouses ?? 0,
          },
          {
            label: t("Inactive"),
            value: stats?.warehouseAnalytics?.inactiveWarehouses ?? 0,
          },
        ]}
      />
      <StatisticsCard
        title={t("Total Suppliers")}
        value={stats?.counts?.suppliers ?? 0}
        description={t("Suppliers")}
        icon={Truck}
        variant="emerald"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={[
          {
            label: t("Active"),
            value: stats?.supplierStatusBreakdown?.active ?? 0,
          },
          {
            label: t("Inactive"),
            value: stats?.supplierStatusBreakdown?.inactive ?? 0,
          },
        ]}
      />
      <StatisticsCard
        title={t("Categories")}
        value={stats?.counts?.categories ?? 0}
        description={t("Product categories")}
        icon={FolderTree}
        variant="amber"
        valueLoading={dataLoading}
        badgeValuesLoading={dataLoading}
        badges={[
          {
            label: t("Active"),
            value: stats?.categoryStatusBreakdown?.active ?? 0,
          },
          {
            label: t("Inactive"),
            value: stats?.categoryStatusBreakdown?.inactive ?? 0,
          },
        ]}
      />
    </div>
  );
}
