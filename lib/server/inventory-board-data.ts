/**
 * Inventory board data — on-hand / reserved / available per product.
 * Reserved merges catalog-level holds with warehouse allocation holds so the
 * pick and non-pick paths both report one consistent number.
 */

import { prisma } from "@/prisma/client";

/** Reorder point used when a product has no explicit lowStockThreshold. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export type InventoryStockState = "ok" | "low" | "out";

export type InventoryBoardRow = {
  id: string;
  name: string;
  sku: string;
  categoryName: string | null;
  supplierName: string | null;
  /** On-hand quantity (catalog total) */
  quantity: number;
  /** Reserved by orders: catalog holds + warehouse allocation holds */
  reserved: number;
  available: number;
  /** Effective reorder point (lowStockThreshold or the default) */
  threshold: number;
  stockState: InventoryStockState;
};

export type InventoryBoardSummary = {
  totalProducts: number;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type InventoryBoard = {
  rows: InventoryBoardRow[];
  summary: InventoryBoardSummary;
};

export async function getInventoryBoard(): Promise<InventoryBoard> {
  const [products, allocationRows, categories, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        reservedQuantity: true,
        lowStockThreshold: true,
        categoryId: true,
        supplierId: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.stockAllocation.findMany({
      select: { productId: true, reservedQuantity: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
  ]);

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const supplierNameById = new Map(suppliers.map((s) => [s.id, s.name]));

  const allocationReservedByProduct = new Map<string, number>();
  for (const row of allocationRows) {
    allocationReservedByProduct.set(
      row.productId,
      (allocationReservedByProduct.get(row.productId) ?? 0) +
        Number(row.reservedQuantity ?? 0),
    );
  }

  const rows: InventoryBoardRow[] = products.map((product) => {
    const quantity = Number(product.quantity);
    const reserved =
      Number(product.reservedQuantity ?? 0) +
      (allocationReservedByProduct.get(product.id) ?? 0);
    const available = quantity - reserved;
    const threshold =
      product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    const stockState: InventoryStockState =
      available <= 0 ? "out" : available <= threshold ? "low" : "ok";

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      categoryName: categoryNameById.get(product.categoryId) ?? null,
      supplierName: supplierNameById.get(product.supplierId) ?? null,
      quantity,
      reserved,
      available,
      threshold,
      stockState,
    };
  });

  const summary: InventoryBoardSummary = rows.reduce(
    (acc, row) => {
      acc.totalQuantity += row.quantity;
      acc.totalReserved += row.reserved;
      acc.totalAvailable += row.available;
      if (row.stockState === "low") acc.lowStockCount += 1;
      if (row.stockState === "out") acc.outOfStockCount += 1;
      return acc;
    },
    {
      totalProducts: rows.length,
      totalQuantity: 0,
      totalReserved: 0,
      totalAvailable: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
  );

  return { rows, summary };
}