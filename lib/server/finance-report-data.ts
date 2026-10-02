/**
 * Finance report data — monthly sales / purchase cost / gross profit plus
 * customer and product rankings. All amounts are in the order currency (USD
 * demo data); no cross-currency conversion is attempted.
 */

import { prisma } from "@/prisma/client";
import type {
  FinanceMonthlyRow,
  FinanceReport,
  FinanceTopCustomer,
  FinanceTopProduct,
} from "@/types/finance";

export type {
  FinanceMonthlyRow,
  FinanceReport,
  FinanceTopCustomer,
  FinanceTopProduct,
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Orders that count as revenue: trade flow past approval, not cancelled. */
const REVENUE_STATUSES = ["approved", "shipped", "delivered", "confirmed", "processing"];

export async function getFinanceReport(): Promise<FinanceReport> {
  const [orders, purchaseOrders, customers] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: REVENUE_STATUSES } },
      select: {
        total: true,
        createdAt: true,
        customerId: true,
        items: {
          select: {
            productId: true,
            productName: true,
            sku: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
    }),
    prisma.purchaseOrder.findMany({
      where: { status: "received" },
      select: { total: true, receivedAt: true, createdAt: true },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true, country: true },
    }),
  ]);

  // ---- Monthly buckets -----------------------------------------------------
  const monthly = new Map<string, FinanceMonthlyRow>();
  const bucketFor = (month: string): FinanceMonthlyRow => {
    let row = monthly.get(month);
    if (!row) {
      row = { month, sales: 0, purchaseCost: 0, profit: 0 };
      monthly.set(month, row);
    }
    return row;
  };

  for (const order of orders) {
    bucketFor(order.createdAt.toISOString().slice(0, 7)).sales += order.total;
  }
  for (const po of purchaseOrders) {
    const at = po.receivedAt ?? po.createdAt;
    bucketFor(at.toISOString().slice(0, 7)).purchaseCost += po.total;
  }

  const monthlyRows = [...monthly.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({
      month: row.month,
      sales: round2(row.sales),
      purchaseCost: round2(row.purchaseCost),
      profit: round2(row.sales - row.purchaseCost),
    }));

  // ---- Customer ranking ----------------------------------------------------
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const customerAgg = new Map<
    string,
    { orderCount: number; revenue: number }
  >();
  for (const order of orders) {
    if (!order.customerId || !customerById.has(order.customerId)) continue;
    const agg = customerAgg.get(order.customerId) ?? {
      orderCount: 0,
      revenue: 0,
    };
    agg.orderCount += 1;
    agg.revenue += order.total;
    customerAgg.set(order.customerId, agg);
  }

  const topCustomers: FinanceTopCustomer[] = [...customerAgg.entries()]
    .map(([customerId, agg]) => ({
      customerId,
      name: customerById.get(customerId)?.name ?? "—",
      country: customerById.get(customerId)?.country ?? "—",
      orderCount: agg.orderCount,
      revenue: round2(agg.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ---- Product ranking -----------------------------------------------------
  const productAgg = new Map<
    string,
    { name: string; sku: string | null; quantity: number; revenue: number }
  >();
  for (const order of orders) {
    for (const item of order.items) {
      const agg = productAgg.get(item.productId) ?? {
        name: item.productName,
        sku: item.sku,
        quantity: 0,
        revenue: 0,
      };
      agg.quantity += item.quantity;
      agg.revenue += item.subtotal;
      productAgg.set(item.productId, agg);
    }
  }

  const topProducts: FinanceTopProduct[] = [...productAgg.entries()]
    .map(([productId, agg]) => ({
      productId,
      name: agg.name,
      sku: agg.sku,
      quantity: agg.quantity,
      revenue: round2(agg.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ---- Totals --------------------------------------------------------------
  const totals = monthlyRows.reduce(
    (acc, row) => {
      acc.sales += row.sales;
      acc.purchaseCost += row.purchaseCost;
      acc.profit += row.profit;
      return acc;
    },
    { sales: 0, purchaseCost: 0, profit: 0 },
  );

  return {
    monthly: monthlyRows,
    topCustomers,
    topProducts,
    totals: {
      sales: round2(totals.sales),
      purchaseCost: round2(totals.purchaseCost),
      profit: round2(totals.profit),
    },
  };
}