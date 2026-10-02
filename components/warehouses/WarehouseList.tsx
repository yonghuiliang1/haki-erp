"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { createWarehouseColumns } from "./WarehouseTableColumns";
import { useAuth } from "@/contexts";
import { useWarehouses, useDashboard, useWarehouseStockSummary } from "@/hooks/queries";
import { useTypedListSearch } from "@/hooks/use-typed-list-search";
import { isDataSlotLoading, isDataSlotUnsettled, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import WarehouseFilters from "./WarehouseFilters";
import WarehouseDialog from "./WarehouseDialog";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { Package, Warehouse as WarehouseIcon } from "lucide-react";
import { PageSectionHeader } from "@/components/shared";
import { Warehouse } from "@/types";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";
import type { DashboardStats } from "@/types";
import type { WarehouseStockSummary } from "@/types/stock-allocation";
import { useT } from "@/lib/i18n/locale-context";

const WarehouseTable = dynamic(
  () =>
    import("./WarehouseTable").then((mod) => ({
      default: mod.WarehouseTable,
    })),
  { ssr: true },
);

export type WarehouseListProps = {
  /** SSR-passed warehouses for first-render hydration (REQ-0021) */
  initialWarehouses?: Warehouse[] | WarehouseForPage[];
  /** SSR dashboard stats for warehouse stat cards (REQ-0025 P2) */
  initialStats?: DashboardStats;
  /** REQ-0066 — warehouse stock summary for utilization column */
  initialWarehouseSummary?: WarehouseStockSummary[];
};

export default function WarehouseList({
  initialWarehouses,
  initialStats,
  initialWarehouseSummary,
}: WarehouseListProps = {}) {
  const t = useT();
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const { user } = useAuth();
  const isUserWarehousesPage = pathname === "/warehouses";

  const warehousesQuery = useWarehouses(initialWarehouses);
  const summaryQuery = useWarehouseStockSummary(initialWarehouseSummary);
  const dashboardQuery = useDashboard(initialStats);
  const allWarehouses = warehousesQuery.data ?? [];

  useSyncSsrQueryData(queryKeys.warehouses.lists(), initialWarehouses);
  useSyncSsrQueryData(
    queryKeys.stockAllocation.summary(),
    initialWarehouseSummary,
  );
  useSyncSsrQueryData(
    queryKeys.dashboard.overview(user?.id ?? ""),
    isUserWarehousesPage && user?.id && initialStats !== undefined
      ? initialStats
      : undefined,
  );

  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const dashboard = isAdmin ? (dashboardQuery.data ?? null) : null;
  const warehousesPageStats = isUserWarehousesPage
    ? (dashboardQuery.data ?? null)
    : null;

  const warehouseTypeBadges = useMemo(() => {
    const dist = dashboard?.warehouseAnalytics?.typeDistribution ?? [];
    const typeMap = new Map(
      dist.map((t) => [(t.type ?? "").toLowerCase().trim(), t.count]),
    );
    const knownTypes = ["main", "secondary", "storage", "hub", "store"];
    const othersCount = [...typeMap.entries()].reduce(
      (sum, [k, v]) => (knownTypes.includes(k) ? sum : sum + v),
      0,
    );
    return [
      { label: t("Main"), value: typeMap.get("main") ?? 0 },
      { label: t("Secondary"), value: typeMap.get("secondary") ?? 0 },
      { label: t("Storage"), value: typeMap.get("storage") ?? 0 },
      { label: t("Hub"), value: typeMap.get("hub") ?? 0 },
      { label: t("Store"), value: typeMap.get("store") ?? 0 },
      { label: t("Others"), value: othersCount },
    ];
  }, [dashboard?.warehouseAnalytics?.typeDistribution]);

  /** Type badges for user /warehouses page cards (from dashboard stats) */
  const warehousesPageTypeBadges = useMemo(() => {
    const dist =
      warehousesPageStats?.warehouseAnalytics?.typeDistribution ?? [];
    const typeMap = new Map(
      dist.map((t) => [(t.type ?? "").toLowerCase().trim(), t.count]),
    );
    const knownTypes = ["main", "secondary", "storage", "hub", "store"];
    const othersCount = [...typeMap.entries()].reduce(
      (sum, [k, v]) => (knownTypes.includes(k) ? sum : sum + v),
      0,
    );
    return [
      { label: t("Main"), value: typeMap.get("main") ?? 0 },
      { label: t("Secondary"), value: typeMap.get("secondary") ?? 0 },
      { label: t("Storage"), value: typeMap.get("storage") ?? 0 },
      { label: t("Hub"), value: typeMap.get("hub") ?? 0 },
      { label: t("Store"), value: typeMap.get("store") ?? 0 },
      { label: t("Others"), value: othersCount },
    ];
  }, [warehousesPageStats?.warehouseAnalytics?.typeDistribution]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  const { searchTerm, setSearchTerm, pagination, setPagination } =
    useTypedListSearch();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

  // REQ-0021: shell-first — only data slots pulse
  const tableDataLoading = isDataSlotLoading(
    warehousesQuery,
    initialWarehouses,
  );
  const userCardsDataLoading = isUserWarehousesPage
    ? isDataSlotUnsettled(dashboardQuery, initialStats)
    : false;
  const adminCardsDataLoading = isAdmin
    ? isDataSlotUnsettled(dashboardQuery, initialStats)
    : false;

  const handleEditWarehouse = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setEditDialogOpen(true);
  }, []);

  const detailBase = pathname?.startsWith("/admin") ? "/admin" : "";
  const summaryById = useMemo(
    () =>
      new Map(
        (summaryQuery.data ?? []).map((s) => [s.warehouseId, s] as const),
      ),
    [summaryQuery.data],
  );
  const totalAllocatedQty = useMemo(
    () =>
      (summaryQuery.data ?? []).reduce((sum, s) => sum + s.totalQuantity, 0),
    [summaryQuery.data],
  );
  const columns = useMemo(
    () =>
      createWarehouseColumns(
        handleEditWarehouse,
        detailBase,
        summaryById,
        totalAllocatedQty,
      ),
    [handleEditWarehouse, detailBase, summaryById, totalAllocatedQty],
  );

  return (
    <div className="flex flex-col poppins">
      {/* Warehouse Management Section Header */}
      <PageSectionHeader
        as="h2"
        icon={WarehouseIcon}
        tone="violet"
        title={t("Warehouse Management")}
        description={t("Manage warehouse locations, allocate stock, and transfer inventory between warehouses.")}
      />

      {/* Store-wide state cards — only on /warehouses page (user), same style as homepage/products */}
      {isUserWarehousesPage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch pb-6">
          <StatisticsCard
            title={t("Total Products")}
            value={warehousesPageStats?.counts.products ?? 0}
            description={t("Products availability")}
            icon={Package}
            variant="rose"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={[
              {
                label: t("Available"),
                value:
                  warehousesPageStats?.productStatusBreakdown?.available ?? 0,
              },
              {
                label: t("Stock low"),
                value:
                  warehousesPageStats?.productStatusBreakdown?.stockLow ?? 0,
              },
              {
                label: t("Stock out"),
                value:
                  warehousesPageStats?.productStatusBreakdown?.stockOut ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title={t("Total Warehouses")}
            value={
              warehousesPageStats?.warehouseAnalytics?.totalWarehouses ?? 0
            }
            description={t("All locations")}
            icon={WarehouseIcon}
            variant="teal"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={[
              {
                label: t("Active"),
                value:
                  warehousesPageStats?.warehouseAnalytics?.activeWarehouses ??
                  0,
              },
              {
                label: t("Inactive"),
                value:
                  warehousesPageStats?.warehouseAnalytics?.inactiveWarehouses ??
                  0,
              },
            ]}
          />
          <StatisticsCard
            title={t("Active Warehouses")}
            value={
              warehousesPageStats?.warehouseAnalytics?.activeWarehouses ?? 0
            }
            description={t("Operational")}
            icon={WarehouseIcon}
            variant="emerald"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={warehousesPageTypeBadges}
          />
          <StatisticsCard
            title={t("Inactive Warehouses")}
            value={
              warehousesPageStats?.warehouseAnalytics?.inactiveWarehouses ?? 0
            }
            description={t("Not in use")}
            icon={WarehouseIcon}
            variant="rose"
            valueLoading={userCardsDataLoading}
            badgeValuesLoading={userCardsDataLoading}
            badges={warehousesPageTypeBadges}
          />
        </div>
      )}

      {/* Summary cards — admin only (same as dashboard Warehouse Analytics) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-6 items-stretch">
          <StatisticsCard
            title={t("Total Warehouses")}
            value={dashboard?.warehouseAnalytics?.totalWarehouses ?? 0}
            description={t("All locations")}
            icon={WarehouseIcon}
            variant="teal"
            valueLoading={adminCardsDataLoading}
            badgeValuesLoading={adminCardsDataLoading}
            badges={[
              {
                label: t("Active"),
                value: dashboard?.warehouseAnalytics?.activeWarehouses ?? 0,
              },
              {
                label: t("Inactive"),
                value: dashboard?.warehouseAnalytics?.inactiveWarehouses ?? 0,
              },
            ]}
          />
          <StatisticsCard
            title={t("Active Warehouses")}
            value={dashboard?.warehouseAnalytics?.activeWarehouses ?? 0}
            description={t("Operational")}
            icon={WarehouseIcon}
            variant="emerald"
            valueLoading={adminCardsDataLoading}
            badgeValuesLoading={adminCardsDataLoading}
            badges={warehouseTypeBadges}
          />
          <StatisticsCard
            title={t("Inactive Warehouses")}
            value={dashboard?.warehouseAnalytics?.inactiveWarehouses ?? 0}
            description={t("Not in use")}
            icon={WarehouseIcon}
            variant="rose"
            valueLoading={adminCardsDataLoading}
            badgeValuesLoading={adminCardsDataLoading}
            badges={warehouseTypeBadges}
          />
        </div>
      )}

      {/* Filters and Actions - Always visible, only disabled during auth check */}
      <div className="pb-6 flex justify-center">
        <div className={APP_SHELL_WIDTH_CLASS}>
          <WarehouseFilters
            allWarehouses={allWarehouses}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            pagination={pagination}
            setPagination={setPagination}
          />
        </div>
      </div>

      <WarehouseTable
        data={allWarehouses}
        columns={columns}
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        statusFilter={statusFilter}
      />

      {/* Defer Dialog until mount to avoid Radix aria-controls hydration mismatch */}
      {isMounted && (
        <WarehouseDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingWarehouse(null);
          }}
          editingWarehouse={editingWarehouse}
          onEditWarehouse={(w) => setEditingWarehouse(w)}
        >
          <div style={{ display: "none" }} />
        </WarehouseDialog>
      )}
    </div>
  );
}
