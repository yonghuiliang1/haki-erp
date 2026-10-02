"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useMemo, useCallback } from "react";
import { Supplier } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { IoClose } from "react-icons/io5";
import { Search } from "lucide-react";
import ExcelJS from "exceljs";
import {
  ActiveInactiveFilterChips,
  CatalogActiveInactiveSelect,
  ExportMenuButton,
} from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import type { CatalogStatusFilter } from "@/lib/ui/catalog-filter-tokens";
import { formatStableDate } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";

type StatusFilter = CatalogStatusFilter;

/**
 * Props for SupplierFilters component
 */
type SupplierFiltersProps = {
  allSuppliers: Supplier[];
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType),
  ) => void;
  userId: string;
};

/**
 * SupplierFilters Component
 * Provides search, filter, and export functionality for suppliers table
 */
export default function SupplierFilters({
  allSuppliers,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  pagination,
  setPagination,
  userId,
}: SupplierFiltersProps) {
  const { toast } = useToast();
  const t = useT();

  /**
   * Filter suppliers based on current filters
   * Memoized to prevent unnecessary recalculations
   */
  const filteredSuppliers = useMemo(() => {
    return allSuppliers.filter((supplier) => {
      const searchMatch =
        !searchTerm ||
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter: all, active, or inactive
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && supplier.status === true) ||
        (statusFilter === "inactive" && supplier.status === false);

      return searchMatch && statusMatch;
    });
  }, [allSuppliers, searchTerm, statusFilter]);

  /**
   * Export filtered suppliers to CSV
   * Memoized callback to prevent unnecessary re-renders
   */
  const exportToCSV = useCallback(() => {
    try {
      if (filteredSuppliers.length === 0) {
        toast({
          title: t("No Data to Export"),
          description: t("There are no suppliers to export with the current filters."),
          variant: "destructive",
        });
        return;
      }

      // Prepare data for CSV export
      const csvData = filteredSuppliers.map((supplier) => ({
        [t("Name")]: supplier.name,
        [t("Status")]: supplier.status ? t("Active") : t("Inactive"),
        [t("Description")]: supplier.description || "-",
        [t("Products")]: supplier.productCount ?? 0,
        [t("Email")]: supplier.email || "-",
        [t("Created At")]: supplier.createdAt
          ? formatStableDate(supplier.createdAt)
          : "-",
        [t("Updated At")]: supplier.updatedAt
          ? formatStableDate(supplier.updatedAt)
          : "-",
      }));

      // Convert to CSV
      const csv = Papa.unparse(csvData);

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `suppliers_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: t("Export Successful"),
        description: t("{count} supplier(s) exported to CSV", {
          count: filteredSuppliers.length,
        }),
      });
    } catch (error) {
      toast({
        title: t("Export Failed"),
        description: t("Failed to export suppliers to CSV"),
        variant: "destructive",
      });
    }
  }, [filteredSuppliers, toast, t]);

  /**
   * Export filtered suppliers to Excel
   * Memoized callback to prevent unnecessary re-renders
   */
  const exportToExcel = useCallback(async () => {
    try {
      if (filteredSuppliers.length === 0) {
        toast({
          title: t("No Data to Export"),
          description: t("There are no suppliers to export with the current filters."),
          variant: "destructive",
        });
        return;
      }

      // Prepare data for Excel export
      const excelData = filteredSuppliers.map((supplier) => ({
        [t("Name")]: supplier.name,
        [t("Status")]: supplier.status ? t("Active") : t("Inactive"),
        [t("Description")]: supplier.description || "-",
        [t("Products")]: supplier.productCount ?? 0,
        [t("Email")]: supplier.email || "-",
        [t("Created At")]: supplier.createdAt
          ? formatStableDate(supplier.createdAt)
          : "-",
        [t("Updated At")]: supplier.updatedAt
          ? formatStableDate(supplier.updatedAt)
          : "-",
      }));

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Suppliers");

      // Add header row with column widths
      worksheet.columns = [
        { header: t("Name"), key: t("Name"), width: 25 },
        { header: t("Status"), key: t("Status"), width: 12 },
        { header: t("Description"), key: t("Description"), width: 30 },
        { header: t("Products"), key: t("Products"), width: 12 },
        { header: t("Email"), key: t("Email"), width: 28 },
        { header: t("Created At"), key: t("Created At"), width: 12 },
        { header: t("Updated At"), key: t("Updated At"), width: 12 },
      ];

      // Add data rows
      worksheet.addRows(excelData);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Generate Excel file and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `suppliers_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: t("Export Successful"),
        description: t("{count} supplier(s) exported to Excel", {
          count: filteredSuppliers.length,
        }),
      });
    } catch (error) {
      toast({
        title: t("Export Failed"),
        description: t("Failed to export suppliers to Excel"),
        variant: "destructive",
      });
    }
  }, [filteredSuppliers, toast, t]);

  return (
    <div className="flex flex-col">
      {/* Single Row: Search (Left) | Filters (Middle) | Export (Right) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Bar - Left */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder={t("Search by Supplier Name...")}
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

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <CatalogActiveInactiveSelect
            entity="supplier"
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        </div>

        <div className="flex-shrink-0">
          <ExportMenuButton
            label={t("Export Suppliers")}
            accent="violet"
            onExportCsv={exportToCSV}
            onExportExcel={exportToExcel}
          />
        </div>
      </div>

      <ActiveInactiveFilterChips
        statusFilter={statusFilter}
        onClear={() => {
          setStatusFilter("all");
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        onReset={() => {
          setStatusFilter("all");
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
      />
    </div>
  );
}
