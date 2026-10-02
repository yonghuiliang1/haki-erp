/**
 * Sales performance data — monthly attribution per salesperson.
 * The month/year on an entry is the *attribution* period and can be adjusted
 * independently of the order date.
 */

import { prisma } from "@/prisma/client";
import type {
  SalesPerformanceData,
  SalesPerformanceEntry,
  SalesPerformanceSummaryRow,
} from "@/types/finance";

export type {
  SalesPerformanceData,
  SalesPerformanceEntry,
  SalesPerformanceSummaryRow,
};

const monthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export async function getSalesPerformance(): Promise<SalesPerformanceData> {
  const [rows, salesUsers, orders] = await Promise.all([
    prisma.performance.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where: { role: "sales" },
      select: { id: true, name: true, email: true },
    }),
    prisma.order.findMany({ select: { id: true, orderNumber: true } }),
  ]);

  const salesNameById = new Map(
    salesUsers.map((u) => [u.id, u.name ?? u.email]),
  );
  const orderNumberById = new Map(orders.map((o) => [o.id, o.orderNumber]));

  const entries: SalesPerformanceEntry[] = rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    orderNumber: orderNumberById.get(row.orderId) ?? row.orderId,
    salesId: row.salesId,
    salesName: salesNameById.get(row.salesId) ?? row.salesId,
    month: row.month,
    year: row.year,
    amount: row.amount,
    notes: row.notes,
  }));

  // Months across all entries, ascending for stable table columns.
  const months = [
    ...new Set(entries.map((entry) => monthKey(entry.year, entry.month))),
  ].sort((a, b) => a.localeCompare(b));

  const summaryBySales = new Map<string, SalesPerformanceSummaryRow>();
  for (const entry of entries) {
    let summary = summaryBySales.get(entry.salesId);
    if (!summary) {
      summary = {
        salesId: entry.salesId,
        salesName: entry.salesName,
        totalAmount: 0,
        entryCount: 0,
        byMonth: {},
      };
      summaryBySales.set(entry.salesId, summary);
    }
    const key = monthKey(entry.year, entry.month);
    summary.totalAmount += entry.amount;
    summary.entryCount += 1;
    summary.byMonth[key] = (summary.byMonth[key] ?? 0) + entry.amount;
  }

  const summary = [...summaryBySales.values()].sort(
    (a, b) => b.totalAmount - a.totalAmount,
  );

  return { entries, summary, months };
}