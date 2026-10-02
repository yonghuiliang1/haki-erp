/**
 * Purchase order Prisma utilities.
 * Creating a purchase order and receiving it into stock (catalog total plus
 * the receiving warehouse allocation when one is named).
 */

import { prisma } from "@/prisma/client";

/** Line input accepted by create. */
export type PurchaseOrderLineInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

export type CreatePurchaseOrderInput = {
  supplierId: string;
  warehouseId?: string;
  currency?: string;
  expectedAt?: Date;
  notes?: string;
  items: PurchaseOrderLineInput[];
};

/**
 * Next human-readable purchase number: PR-YYYY-NNN (sequence per year).
 */
async function generatePurchaseNo(): Promise<string> {
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const yearCount = await prisma.purchaseOrder.count({
    where: { createdAt: { gte: yearStart, lt: yearEnd } },
  });

  return `PR-${year}-${String(yearCount + 1).padStart(3, "0")}`;
}

/**
 * Create a purchase order with snapshot lines.
 * Starts as `pending` — stock only moves when the order is received.
 */
export async function createPurchaseOrder(
  data: CreatePurchaseOrderInput,
  userId: string,
) {
  // The supplier and warehouse columns are plain ids (no Prisma relation), so
  // existence is checked here to keep bad references out of the table.
  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
    select: { id: true },
  });
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  if (data.warehouseId) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
      select: { id: true },
    });
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }
  }

  const purchaseNo = await generatePurchaseNo();

  const productIds = [...new Set(data.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const itemRows = data.items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    const subtotal = Math.round(item.quantity * item.unitCost * 100) / 100;
    total += subtotal;
    return {
      productId: item.productId,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal,
    };
  });

  return prisma.purchaseOrder.create({
    data: {
      purchaseNo,
      supplierId: data.supplierId,
      warehouseId: data.warehouseId ?? null,
      status: "pending",
      currency: data.currency ?? null,
      total: Math.round(total * 100) / 100,
      expectedAt: data.expectedAt ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
      items: { create: itemRows },
    },
    include: { items: true },
  });
}

/**
 * Receive a purchase order: stock flows into the catalog, and into the named
 * warehouse allocation when one is set. Received orders are immutable.
 */
export async function receivePurchaseOrder(id: string, userId: string) {
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }
  if (purchaseOrder.status === "received") {
    throw new Error("Purchase order has already been received");
  }
  if (purchaseOrder.status === "cancelled") {
    throw new Error("Cancelled purchase orders cannot be received");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of purchaseOrder.items) {
      // Catalog total grows first — it is the source of truth for available stock.
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantity: { increment: item.quantity },
          updatedAt: new Date(),
        },
      });

      // Named receiving warehouse: grow (or open) its slice of the stock.
      if (purchaseOrder.warehouseId) {
        await tx.stockAllocation.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: purchaseOrder.warehouseId,
            },
          },
          create: {
            productId: item.productId,
            warehouseId: purchaseOrder.warehouseId,
            quantity: BigInt(item.quantity),
            reservedQuantity: BigInt(0),
            userId,
          },
          update: {
            quantity: { increment: item.quantity },
            updatedAt: new Date(),
          },
        });
      }
    }

    await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: "received",
        receivedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });
  });

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
}

/**
 * List purchase orders with supplier names (supplier has no Prisma relation).
 */
export async function getPurchaseOrders() {
  const [orders, suppliers] = await Promise.all([
    prisma.purchaseOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
  ]);

  const supplierNameById = new Map(suppliers.map((s) => [s.id, s.name]));
  return orders.map((order) => ({
    ...order,
    supplierName: supplierNameById.get(order.supplierId) ?? null,
  }));
}

/** Single purchase order with supplier name. */
export async function getPurchaseOrderById(id: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return null;

  const supplier = await prisma.supplier.findUnique({
    where: { id: order.supplierId },
    select: { name: true },
  });
  return { ...order, supplierName: supplier?.name ?? null };
}