/**
 * Order Filters Component
 * Search and filter controls for orders with export functionality
 * Matches Product section UI patterns with Status/Payment dropdowns and Export dropdown
 */

"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { DismissibleFilterChips, ExportMenuButton } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToCSV } from "@/lib/export";
import { formatStableDate } from "@/lib/format";
import { OrderStatusDropDown } from "./OrderStatusFilter";
import { PaymentStatusDropDown } from "./PaymentStatusFilter";
import {
  OrderSourceDropDown,
  type OrderSourceFilterValue,
} from "./OrderSourceFilter";
import { OrderStatusBadge, PaymentStatusBadge } from "@/lib/ui/semantic-badges";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";
import type { Order } from "@/types";
import { useT } from "@/lib/i18n/locale-context";

const ORDER_SOURCE_LABELS: Record<OrderSourceFilterValue, string> = {
  client: "Client orders",
  personal: "Personal orders",
  both: "View both",
};

interface OrderFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pagination: PaginationType;
  setPagination: (
    pagination: PaginationType | ((prev: PaginationType) => PaginationType),
  ) => void;
  allOrders: Order[];
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPaymentStatuses: string[];
  setSelectedPaymentStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  /** When set, show Order type filter (Client / Personal / View both) */
  showOrderSourceFilter?: boolean;
  orderSourceFilter?: OrderSourceFilterValue;
  setOrderSourceFilter?: (value: OrderSourceFilterValue) => void;
}

export default function OrderFilters({
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  allOrders,
  selectedStatuses,
  setSelectedStatuses,
  selectedPaymentStatuses,
  setSelectedPaymentStatuses,
  showOrderSourceFilter,
  orderSourceFilter = "both",
  setOrderSourceFilter,
}: OrderFiltersProps) {
  const { toast } = useToast();
  const t = useT();

  /**
   * Filter orders based on search term and selected filters
   */
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.notes &&
          order.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(order.status);

      // Payment status filter
      const matchesPaymentStatus =
        selectedPaymentStatuses.length === 0 ||
        selectedPaymentStatuses.includes(order.paymentStatus);

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  }, [allOrders, searchTerm, selectedStatuses, selectedPaymentStatuses]);

  /**
   * Export filtered orders to CSV
   * Memoized callback to prevent unnecessary re-renders
   */
  const handleExportToCSV = useCallback(() => {
    try {
      if (filteredOrders.length === 0) {
        toast({
          title: t("No Data to Export"),
          description: t(
            "There are no orders to export with the current filters.",
          ),
          variant: "destructive",
        });
        return;
      }

      const csvData = filteredOrders.map((order) => ({
        [t("Order Number")]: order.orderNumber,
        [t("Order Date")]: formatStableDate(order.createdAt),
        [t("Status")]: order.status,
        [t("Payment Status")]: order.paymentStatus,
        [t("Subtotal")]: order.subtotal.toFixed(2),
        [t("Tax")]: order.tax ? order.tax.toFixed(2) : "0.00",
        [t("Shipping")]: order.shipping ? order.shipping.toFixed(2) : "0.00",
        [t("Total")]: order.total.toFixed(2),
        [t("Items Count")]: order.items.length,
        [t("Tracking Number")]: order.trackingNumber || "-",
      }));

      const columns = [
        { header: t("Order Number"), key: t("Order Number") },
        { header: t("Order Date"), key: t("Order Date") },
        { header: t("Status"), key: t("Status") },
        { header: t("Payment Status"), key: t("Payment Status") },
        { header: t("Subtotal"), key: t("Subtotal") },
        { header: t("Tax"), key: t("Tax") },
        { header: t("Shipping"), key: t("Shipping") },
        { header: t("Total"), key: t("Total") },
        { header: t("Items Count"), key: t("Items Count") },
        { header: t("Tracking Number"), key: t("Tracking Number") },
      ];

      exportToCSV(csvData, columns, "stockly-orders");

      toast({
        title: t("CSV Export Successful!"),
        description: t("{count} orders exported to CSV file.", {
          count: filteredOrders.length,
        }),
      });
    } catch (error) {
      toast({
        title: t("Export Failed"),
        description: t("Failed to export orders to CSV. Please try again."),
        variant: "destructive",
      });
    }
  }, [filteredOrders, toast, t]);

  /**
   * Export filtered orders to Excel
   * Memoized callback to prevent unnecessary re-renders
   */
  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredOrders.length === 0) {
        toast({
          title: t("No Data to Export"),
          description: t(
            "There are no orders to export with the current filters.",
          ),
          variant: "destructive",
        });
        return;
      }

      const excelData = filteredOrders.map((order) => ({
        [t("Order Number")]: order.orderNumber,
        [t("Order Date")]: formatStableDate(order.createdAt),
        [t("Status")]: order.status,
        [t("Payment Status")]: order.paymentStatus,
        [t("Subtotal")]: order.subtotal.toFixed(2),
        [t("Tax")]: order.tax ? order.tax.toFixed(2) : "0.00",
        [t("Shipping")]: order.shipping ? order.shipping.toFixed(2) : "0.00",
        [t("Total")]: order.total.toFixed(2),
        [t("Items Count")]: order.items.length,
        [t("Tracking Number")]: order.trackingNumber || "-",
      }));

      await exportToExcel({
        sheetName: "Orders",
        fileName: "stockly-orders",
        columns: [
          { header: t("Order Number"), key: t("Order Number"), width: 20 },
          { header: t("Order Date"), key: t("Order Date"), width: 12 },
          { header: t("Status"), key: t("Status"), width: 12 },
          { header: t("Payment Status"), key: t("Payment Status"), width: 15 },
          { header: t("Subtotal"), key: t("Subtotal"), width: 12 },
          { header: t("Tax"), key: t("Tax"), width: 10 },
          { header: t("Shipping"), key: t("Shipping"), width: 12 },
          { header: t("Total"), key: t("Total"), width: 12 },
          { header: t("Items Count"), key: t("Items Count"), width: 12 },
          { header: t("Tracking Number"), key: t("Tracking Number"), width: 20 },
        ],
        data: excelData,
      });

      toast({
        title: t("Excel Export Successful!"),
        description: t("{count} orders exported to Excel file.", {
          count: filteredOrders.length,
        }),
      });
    } catch (error) {
      toast({
        title: t("Export Failed"),
        description: t("Failed to export orders to Excel. Please try again."),
        variant: "destructive",
      });
    }
  }, [filteredOrders, toast, t]);

  const handleResetFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedPaymentStatuses([]);
    if (setOrderSourceFilter) setOrderSourceFilter("both");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    setSelectedStatuses,
    setSelectedPaymentStatuses,
    setOrderSourceFilter,
    setPagination,
  ]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    const groups: FilterChipGroup[] = [];

    if (showOrderSourceFilter && orderSourceFilter !== "both") {
      groups.push({
        label: t("Type"),
        values: [orderSourceFilter],
        onClear: () => setOrderSourceFilter?.("both"),
        renderBadge: (value) => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>
            {t(ORDER_SOURCE_LABELS[value as OrderSourceFilterValue] ?? value)}
          </span>
        ),
      });
    }

    groups.push(
      {
        label: t("Status"),
        values: selectedStatuses,
        onClear: () => setSelectedStatuses([]),
        renderBadge: (value) => (
          <OrderStatusBadge status={value} size="compact" />
        ),
      },
      {
        label: t("Payment"),
        values: selectedPaymentStatuses,
        onClear: () => setSelectedPaymentStatuses([]),
        renderBadge: (value) => (
          <PaymentStatusBadge status={value} size="compact" />
        ),
      },
    );

    return groups;
  }, [
    showOrderSourceFilter,
    orderSourceFilter,
    selectedStatuses,
    selectedPaymentStatuses,
    setOrderSourceFilter,
    setSelectedStatuses,
    setSelectedPaymentStatuses,
    t,
  ]);

  return (
    <div className="flex flex-col gap-2">
      {/* Single Row: Search (Left) | Filters (Middle) | Export (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Bar - Left */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder={t("Search by Order #...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={FILTER_SEARCH_INPUT_SKY_CLASS}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-md"
            >
              <IoClose className="h-4 w-4 text-gray-700 dark:text-white/80" />
            </Button>
          )}
        </div>

        {/* Filters - Middle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {showOrderSourceFilter && setOrderSourceFilter && (
            <OrderSourceDropDown
              value={orderSourceFilter}
              onChange={setOrderSourceFilter}
            />
          )}
          <OrderStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
          <PaymentStatusDropDown
            selectedPaymentStatuses={selectedPaymentStatuses}
            setSelectedPaymentStatuses={setSelectedPaymentStatuses}
          />
        </div>

        {/* Export Dropdown - Right */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <ExportMenuButton
            label={t("Export Orders")}
            accent="violet"
            disabled={filteredOrders.length === 0}
            onExportCsv={handleExportToCSV}
            onExportExcel={handleExportToExcel}
          />
        </div>
      </div>

      <DismissibleFilterChips
        groups={filterChipGroups}
        onReset={handleResetFilters}
      />
    </div>
  );
}
