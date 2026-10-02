"use client";

/**
 * Stock board: on-hand / reserved / available per product with low-stock alerts.
 * Data arrives from the SSR page; filtering and search stay client-side.
 */

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContentWrapper, PageSectionHeader } from "@/components/shared";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { ProductStockStatusBadge } from "@/lib/ui/semantic-badges";
import { useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import type {
  InventoryBoard,
  InventoryBoardRow,
  InventoryStockState,
} from "@/lib/server/inventory-board-data";

export type AdminInventoryContentProps = {
  initialBoard: InventoryBoard;
};

type StockFilter = "all" | "low" | "out";

const FILTER_LABELS: Array<{ value: StockFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
];

/** Map board state to the shared badge wording. */
function stockStateBadgeKey(state: InventoryStockState): string {
  if (state === "out") return "out_of_stock";
  if (state === "low") return "low_stock";
  return "in_stock";
}

export default function AdminInventoryContent({
  initialBoard,
}: AdminInventoryContentProps) {
  const t = useT();
  const { summary, rows } = initialBoard;
  const [filter, setFilter] = useState<StockFilter>("all");
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "low" && row.stockState !== "low") return false;
      if (filter === "out" && row.stockState !== "out") return false;
      if (!query) return true;
      return (
        row.name.toLowerCase().includes(query) ||
        row.sku.toLowerCase().includes(query) ||
        (row.categoryName ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, filter, search]);

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h2"
          icon={Boxes}
          tone="teal"
          title={t("Stock Board")}
          description={t(
            "On-hand, reserved, and available stock with low-stock alerts.",
          )}
        />

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch">
          <StatisticsCard
            compact
            title={t("On-hand")}
            value={summary.totalQuantity}
            description={t("{count} products", {
              count: summary.totalProducts,
            })}
            icon={Boxes}
            variant="sky"
          />
          <StatisticsCard
            compact
            title={t("Reserved")}
            value={summary.totalReserved}
            description={t("Locked by open orders")}
            icon={ShieldCheck}
            variant="amber"
          />
          <StatisticsCard
            compact
            title={t("Available")}
            value={summary.totalAvailable}
            description={t("On-hand minus reserved")}
            icon={PackageCheck}
            variant="emerald"
          />
          <StatisticsCard
            compact
            title={t("Alerts")}
            value={summary.lowStockCount + summary.outOfStockCount}
            description={t("Low or out of stock")}
            icon={AlertTriangle}
            variant="rose"
            badges={[
              { label: t("Low"), value: summary.lowStockCount },
              { label: t("Out"), value: summary.outOfStockCount },
            ]}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            {FILTER_LABELS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? "default" : "outline"}
                onClick={() => setFilter(option.value)}
                className="rounded-full"
              >
                {t(option.label)}
              </Button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Search product, SKU, category…")}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        {/* Stock table */}
        <div className="rounded-[28px] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Product")}</TableHead>
                <TableHead>{t("Category")}</TableHead>
                <TableHead className="text-right">{t("On-hand")}</TableHead>
                <TableHead className="text-right">{t("Reserved")}</TableHead>
                <TableHead className="text-right">{t("Available")}</TableHead>
                <TableHead className="text-right">{t("Reorder Point")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <InventoryRow key={row.id} row={row} />
              ))}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("No products match the current filter.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContentWrapper>
  );
}

/** One stock row — available quantity colored by state for quick scanning. */
function InventoryRow({ row }: { row: InventoryBoardRow }) {
  const availableClass =
    row.stockState === "out"
      ? "text-red-600 dark:text-red-400"
      : row.stockState === "low"
        ? "text-orange-600 dark:text-orange-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-normal text-gray-700 dark:text-white truncate">
            {row.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {row.sku}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
        {row.categoryName ?? "—"}
      </TableCell>
      <TableCell className="text-right text-sm">{row.quantity}</TableCell>
      <TableCell className="text-right text-sm">{row.reserved}</TableCell>
      <TableCell className={cn("text-right text-sm", availableClass)}>
        {row.available}
      </TableCell>
      <TableCell className="text-right text-sm text-gray-600 dark:text-gray-300">
        {row.threshold}
      </TableCell>
      <TableCell>
        <ProductStockStatusBadge
          status={stockStateBadgeKey(row.stockState)}
          size="detail"
        />
      </TableCell>
    </TableRow>
  );
}