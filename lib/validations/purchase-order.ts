/**
 * Purchase order validation schemas
 */

import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitCost: z.number().positive("Unit cost must be greater than 0"),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1).optional(),
  currency: z.enum(["USD", "EUR", "CNY"]).optional(),
  expectedAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  notes: z.string().max(1000).optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one line is required"),
});

export type CreatePurchaseOrderFormData = z.infer<
  typeof createPurchaseOrderSchema
>;