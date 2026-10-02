/**
 * Invoice Filters Component
 * Search and filter controls for invoices with export functionality
 * Matches Order/Product section UI patterns with Status dropdown and Export dropdown
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
import { InvoiceStatusDropDown } from "./InvoiceStatusFilter";
import {
  InvoiceSourceDropDown,
  type InvoiceSourceFilterValue,
} from "./InvoiceSourceFilter";
import { InvoiceStatusBadge } from "@/lib/ui/semantic-badges";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";
import type { Invoice } from "@/types";
import { useT } from "@/lib/i18n/locale-context";

const INVOICE_SOURCE_LABELS: Record<InvoiceSourceFilterValue, string> = {
  client: "Client invoices",
  personal: "Personal invoices",
  both: "View both",
};

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pagination: PaginationType;
  setPagination: (
    pagination: PaginationType | ((prev: PaginationType) => PaginationType),
  ) => void;
  allInvoices: Invoice[];
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  /** When set, show Invoice type filter (Client / Personal / View both) */
  showInvoiceSourceFilter?: boolean;
  invoiceSourceFilter?: InvoiceSourceFilterValue;
  setInvoiceSourceFilter?: (value: InvoiceSourceFilterValue) => void;
}

export default function InvoiceFilters({
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  allInvoices,
  selectedStatuses,
  setSelectedStatuses,
  showInvoiceSourceFilter,
  invoiceSourceFilter = "both",
  setInvoiceSourceFilter,
}: InvoiceFiltersProps) {
  const { toast } = useToast();
  const t = useT();

  /** Client-side status filter — search is API-scoped via parent list data. */
  const filteredInvoices = useMemo(() => {
    if (selectedStatuses.length === 0) return allInvoices;
    return allInvoices.filter((invoice) =>
      selectedStatuses.includes(invoice.status),
    );
  }, [allInvoices, selectedStatuses]);

  /**
   * Export filtered invoices to CSV
   * Memoized callback to prevent unnecessary re-renders
   */
  const handleExportToCSV = useCallback(() => {
    try {
      if (filteredInvoices.length === 0) {
        toast({
          title: t("No Data to Export"),
          description: t(
            "There are no invoices to export with the current filters.",
          ),
          variant: "destructive",
        });
        return;
      }

      const csvData = filteredInvoices.map((invoice) => ({
        [t("Invoice Number")]: invoice.invoiceNumber,
        [t("Invoice Date")]: formatStableDate(invoice.createdAt),
        [t("Status")]: invoice.status,
        [t("Subtotal")]: invoice.subtotal.toFixed(2),
        [t("Tax")]: invoice.tax ? invoice.tax.toFixed(2) : "0.00",
        [t("Discount")]: invoice.discount ? invoice.discount.toFixed(2) : "0.00",
        [t("Total")]: invoice.total.toFixed(2),
        [t("Amount Paid")]: invoice.amountPaid.toFixed(2),
        [t("Amount Due")]: invoice.amountDue.toFixed(2),
        [t("Due Date")]: formatStableDate(invoice.dueDate),
      }));

      const columns = [
        { header: t("Invoice Number"), key: t("Invoice Number") },
        { header: t("Invoice Date"), key: t("Invoice Date") },
        { header: t("Status"), key: t("Status") },
        { header: t("Subtotal"), key: t("Subtotal") },
        { header: t("Tax"), key: t("Tax") },
        { header: t("Discount"), key: t("Discount") },
        { header: t("Total"), key: t("Total") },
        { header: t("Amount Paid"), key: t("Amount Paid") },
        { header: t("Amount Due"), key: t("Amount Due") },
        { header: t("Due Date"), key: t("Due Date") },
      ];

      exportToCSV(csvData, columns, "stockly-invoices");

      toast({
        title: t("CSV Export Successful!"),
        description: t("{count} invoices exported to CSV file.", {
          count: filteredInvoices.length,
        }),
      });
    } catch (error) {
      toast({
        title: t("Export Failed"),
        description: t("Failed to export invoices to CSV. Please try again."),
        variant: "destructive",
      });
    }
  }, [filteredInvoices, toast, t]);

  /**
   * Export filtered invoices to Excel
   * Memoized callback to prevent unnecessary re-renders
   */
  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredInvoices.length === 0) {
        toast({
          title: t("No Data to Export"),
          description: t(
            "There are no invoices to export with the current filters.",
          ),
          variant: "destructive",
        });
        return;
      }

      const excelData = filteredInvoices.map((invoice) => ({
        [t("Invoice Number")]: invoice.invoiceNumber,
        [t("Invoice Date")]: formatStableDate(invoice.createdAt),
        [t("Status")]: invoice.status,
        [t("Subtotal")]: invoice.subtotal.toFixed(2),
        [t("Tax")]: invoice.tax ? invoice.tax.toFixed(2) : "0.00",
        [t("Discount")]: invoice.discount ? invoice.discount.toFixed(2) : "0.00",
        [t("Total")]: invoice.total.toFixed(2),
        [t("Amount Paid")]: invoice.amountPaid.toFixed(2),
        [t("Amount Due")]: invoice.amountDue.toFixed(2),
        [t("Due Date")]: formatStableDate(invoice.dueDate),
      }));

      await exportToExcel({
        sheetName: "Invoices",
        fileName: "stockly-invoices",
        columns: [
          { header: t("Invoice Number"), key: t("Invoice Number"), width: 20 },
          { header: t("Invoice Date"), key: t("Invoice Date"), width: 12 },
          { header: t("Status"), key: t("Status"), width: 12 },
          { header: t("Subtotal"), key: t("Subtotal"), width: 12 },
          { header: t("Tax"), key: t("Tax"), width: 10 },
          { header: t("Discount"), key: t("Discount"), width: 12 },
          { header: t("Total"), key: t("Total"), width: 12 },
          { header: t("Amount Paid"), key: t("Amount Paid"), width: 12 },
          { header: t("Amount Due"), key: t("Amount Due"), width: 12 },
          { header: t("Due Date"), key: t("Due Date"), width: 12 },
        ],
        data: excelData,
      });

      toast({
        title: t("Excel Export Successful!"),
        description: t("{count} invoices exported to Excel file.", {
          count: filteredInvoices.length,
        }),
      });
    } catch (error) {
      toast({
        title: t("Export Failed"),
        description: t("Failed to export invoices to Excel. Please try again."),
        variant: "destructive",
      });
    }
  }, [filteredInvoices, toast, t]);

  const handleResetFilters = useCallback(() => {
    setSelectedStatuses([]);
    if (setInvoiceSourceFilter) setInvoiceSourceFilter("both");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setSelectedStatuses, setInvoiceSourceFilter, setPagination]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    const groups: FilterChipGroup[] = [];

    if (showInvoiceSourceFilter && invoiceSourceFilter !== "both") {
      groups.push({
        label: t("Type"),
        values: [invoiceSourceFilter],
        onClear: () => setInvoiceSourceFilter?.("both"),
        renderBadge: (value) => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>
            {t(INVOICE_SOURCE_LABELS[value as InvoiceSourceFilterValue] ?? value)}
          </span>
        ),
      });
    }

    groups.push({
      label: t("Status"),
      values: selectedStatuses,
      onClear: () => setSelectedStatuses([]),
      renderBadge: (value) => (
        <InvoiceStatusBadge status={value} size="compact" />
      ),
    });

    return groups;
  }, [
    showInvoiceSourceFilter,
    invoiceSourceFilter,
    selectedStatuses,
    setInvoiceSourceFilter,
    setSelectedStatuses,
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
            placeholder={t("Search by Invoice #...")}
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
          {showInvoiceSourceFilter && setInvoiceSourceFilter && (
            <InvoiceSourceDropDown
              value={invoiceSourceFilter}
              onChange={setInvoiceSourceFilter}
            />
          )}
          <InvoiceStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
        </div>

        {/* Export Dropdown - Right */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <ExportMenuButton
            label={t("Export Invoices")}
            accent="violet"
            disabled={filteredInvoices.length === 0}
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
