/**
 * Purchase order types
 */

export type PurchaseOrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "received"
  | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitCost: number;
  subtotal: number;
  /** ISO string from API transforms */
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseNo: string;
  supplierId: string;
  /** Resolved on the server (supplier has no Prisma relation) */
  supplierName?: string | null;
  warehouseId?: string | null;
  status: PurchaseOrderStatus;
  currency?: string | null;
  total: number;
  expectedAt?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy: string;
  updatedBy?: string | null;
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  warehouseId?: string;
  currency?: "USD" | "EUR" | "CNY";
  expectedAt?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
}