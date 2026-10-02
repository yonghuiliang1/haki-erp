/**
 * Automatic low-stock alerting.
 * Called after stock movements (approval reservations, receiving, shipping).
 * One unread alert per product is kept at a time, so a burst of orders does
 * not flood the notification list.
 */

import { prisma } from "@/prisma/client";
import { createInAppNotification } from "@/lib/notifications/in-app";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/server/inventory-board-data";
import { logger } from "@/lib/logger";

/**
 * Re-check the given products and raise an alert for every one whose available
 * stock (on-hand minus reserved, catalog plus allocation holds) is at or below
 * its reorder point.
 */
export async function checkLowStockForProducts(
  productIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(productIds)].filter(Boolean);
  if (uniqueIds.length === 0) return;

  const [products, allocations] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        reservedQuantity: true,
        lowStockThreshold: true,
        userId: true,
      },
    }),
    prisma.stockAllocation.findMany({
      where: { productId: { in: uniqueIds } },
      select: { productId: true, reservedQuantity: true },
    }),
  ]);

  const allocationReserved = new Map<string, number>();
  for (const row of allocations) {
    allocationReserved.set(
      row.productId,
      (allocationReserved.get(row.productId) ?? 0) +
        Number(row.reservedQuantity ?? 0),
    );
  }

  for (const product of products) {
    const available =
      Number(product.quantity) -
      Number(product.reservedQuantity ?? 0) -
      (allocationReserved.get(product.id) ?? 0);
    const threshold =
      product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    if (available > threshold) continue;

    // Skip when an unread alert for the same product is already waiting.
    const pendingAlert = await prisma.notification.findFirst({
      where: {
        userId: product.userId,
        type: { in: ["low_stock", "stock_out"] },
        read: false,
        metadata: { path: ["productId"], equals: product.id },
      },
      select: { id: true },
    });
    if (pendingAlert) continue;

    const isOut = available <= 0;
    createInAppNotification({
      userId: product.userId,
      type: isOut ? "stock_out" : "low_stock",
      title: isOut ? "Stock Out Alert" : "Low Stock Alert",
      message: isOut
        ? `${product.name} is out of stock (SKU: ${product.sku}). Please restock immediately.`
        : `${product.name} dropped to ${available} available, at or below the reorder point of ${threshold} (SKU: ${product.sku}).`,
      link: "/admin/inventory",
      metadata: { productId: product.id, sku: product.sku },
    }).catch((error) => {
      logger.error("Failed to create low-stock notification:", error);
    });
  }
}