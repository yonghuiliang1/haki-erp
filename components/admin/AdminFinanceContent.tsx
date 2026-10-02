"use client";

/**
 * Finance & performance page content.
 * Monthly sales / purchase cost / profit, customer and product rankings, and
 * per-salesperson monthly performance with adjustable attribution months.
 */

import React, { useState } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  DollarSign,
  LineChart,
  Percent,
  ShoppingBag,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  PageContentWrapper,
  PageSectionHeader,
} from "@/components/shared";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { useFinanceReport, useSalesPerformance, useUpdateSalesPerformance } from "@/hooks/queries";
import { formatStableCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  FinanceReport,
  SalesPerformanceData,
  SalesPerformanceEntry,
} from "@/types";

export type AdminFinanceContentProps = {
  initialReport?: FinanceReport;
  initialPerformance?: SalesPerformanceData;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const YEAR_OPTIONS = [2025, 2026, 2027];

const cardShell =
  "rounded-[28px] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden";

export default function AdminFinanceContent({
  initialReport,
  initialPerformance,
}: AdminFinanceContentProps) {
  const reportQuery = useFinanceReport(initialReport);
  const report = reportQuery.data ?? initialReport;
  const performanceQuery = useSalesPerformance(initialPerformance);
  const performance = performanceQuery.data ?? initialPerformance;

  const [adjustTarget, setAdjustTarget] = useState<SalesPerformanceEntry | null>(
    null,
  );

  if (!report || !performance) {
    return null;
  }

  const margin =
    report.totals.sales > 0
      ? (report.totals.profit / report.totals.sales) * 100
      : 0;

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h2"
          icon={BarChart3}
          tone="teal"
          title="Finance & Performance"
          description="Monthly sales, purchase cost and profit; rankings; salesperson performance."
        />

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch">
          <StatisticsCard
            compact
            title="Total Sales"
            value={formatStableCurrency(report.totals.sales)}
            description="Approved orders and beyond"
            icon={DollarSign}
            variant="sky"
          />
          <StatisticsCard
            compact
            title="Purchase Cost"
            value={formatStableCurrency(report.totals.purchaseCost)}
            description="Received purchase orders"
            icon={Wallet}
            variant="amber"
          />
          <StatisticsCard
            compact
            title="Gross Profit"
            value={formatStableCurrency(report.totals.profit)}
            description="Sales minus purchase cost"
            icon={LineChart}
            variant="emerald"
          />
          <StatisticsCard
            compact
            title="Profit Margin"
            value={`${margin.toFixed(1)}%`}
            description="Profit / sales"
            icon={Percent}
            variant="violet"
          />
        </div>

        {/* Monthly breakdown */}
        <div className={cardShell}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Purchase Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.monthly.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="text-sm text-gray-700 dark:text-white">
                    {row.month}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatStableCurrency(row.sales)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatStableCurrency(row.purchaseCost)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm",
                      row.profit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatStableCurrency(row.profit)}
                  </TableCell>
                </TableRow>
              ))}
              {report.monthly.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No financial data yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={cardShell}>
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-white">
                Top Customers
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topCustomers.map((customer) => (
                  <TableRow key={customer.customerId}>
                    <TableCell className="text-sm text-gray-700 dark:text-white">
                      {customer.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {customer.country}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {customer.orderCount}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatStableCurrency(customer.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={cardShell}>
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <ShoppingBag className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-white">
                Top Products
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topProducts.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <span className="block text-sm text-gray-700 dark:text-white truncate">
                        {product.name}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {product.sku ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatStableCurrency(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sales performance */}
        <div className="flex items-center gap-2 pt-2">
          <Users className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
            Sales Performance
          </h3>
        </div>

        <div className={cardShell}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                {performance.months.map((month) => (
                  <TableHead key={month} className="text-right">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.summary.map((row) => (
                <TableRow key={row.salesId}>
                  <TableCell className="text-sm text-gray-700 dark:text-white">
                    {row.salesName}
                    <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                      {row.entryCount} order
                      {row.entryCount === 1 ? "" : "s"}
                    </span>
                  </TableCell>
                  {performance.months.map((month) => (
                    <TableCell
                      key={month}
                      className="text-right text-sm text-gray-600 dark:text-gray-300"
                    >
                      {row.byMonth[month]
                        ? formatStableCurrency(row.byMonth[month])
                        : "—"}
                    </TableCell>
                  ))}
                  <TableCell className="text-right text-sm text-gray-700 dark:text-white">
                    {formatStableCurrency(row.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
              {performance.summary.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={performance.months.length + 2}
                    className="text-center text-muted-foreground py-8"
                  >
                    No performance entries yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Entry detail with adjustable attribution */}
        <div className={cardShell}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Attribution</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Adjust</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs text-gray-700 dark:text-white">
                    {entry.orderNumber}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                    {entry.salesName}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 dark:text-white">
                    {entry.year}-{String(entry.month).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px] truncate">
                    {entry.notes ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatStableCurrency(entry.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAdjustTarget(entry)}
                      className="h-8 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 text-xs text-violet-600 dark:text-violet-300 hover:bg-violet-500/20"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Move
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {adjustTarget && (
        <PerformanceAdjustDialog
          key={adjustTarget.id}
          entry={adjustTarget}
          open={adjustTarget !== null}
          onOpenChange={(open) => {
            if (!open) setAdjustTarget(null);
          }}
        />
      )}
    </PageContentWrapper>
  );
}

/** Adjust the attribution month/year of one performance entry. */
function PerformanceAdjustDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: SalesPerformanceEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateSalesPerformance();
  const [year, setYear] = useState(entry.year);
  const [month, setMonth] = useState(entry.month);
  const [notes, setNotes] = useState(entry.notes ?? "");

  const handleSubmit = () => {
    updateMutation.mutate(
      { id: entry.id, data: { month, year, notes: notes.trim() || undefined } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!updateMutation.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Performance Entry</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/80">Year</label>
            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className={cn("h-11", DIALOG_FORM_FIELD_VIOLET)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                position="popper"
                sideOffset={5}
                align="start"
              >
                {YEAR_OPTIONS.map((option) => (
                  <SelectItem
                    key={option}
                    value={String(option)}
                    className={DIALOG_SELECT_ITEM_CLASS}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/80">Month</label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                    DIALOG_FORM_FIELD_VIOLET,
                  )}
                  aria-hidden
                >
                  {MONTH_LABELS[month - 1]}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={String(month)}
                  onValueChange={(value) => setMonth(Number(value))}
                >
                  <SelectTrigger
                    className={cn("h-11", DIALOG_FORM_FIELD_VIOLET)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {MONTH_LABELS.map((label, index) => (
                      <SelectItem
                        key={label}
                        value={String(index + 1)}
                        className={DIALOG_SELECT_ITEM_CLASS}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/80">
            Reason (kept on the entry)
          </label>
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. shipment landed next month"
            className={cn("h-11", DIALOG_FORM_FIELD_VIOLET)}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}