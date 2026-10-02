/**
 * Order validation schemas
 * Zod schemas for order-related form validation
 */

import { z } from "zod";

/**
 * Shipping address schema
 */
export const shippingAddressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

/**
 * Billing address schema
 */
export const billingAddressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

/**
 * Order item schema
 */
export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  /** REQ-0068 — optional in Zod; server requires when product has allocations */
  warehouseId: z.string().min(1).optional(),
});

/**
 * Optional trimmed string — blank input becomes undefined instead of "".
 */
const optionalTradeText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().max(max).optional(),
  );

/** Optional positive number — blank input becomes undefined. */
const optionalExchangeRate = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  },
  z.number().positive("Exchange rate must be greater than 0").optional(),
);

/** Export trade fields shared by create + update schemas. */
const tradeFieldsShape = {
  customerId: optionalTradeText(40),
  currency: z.enum(["USD", "EUR", "CNY"]).optional(),
  exchangeRate: optionalExchangeRate,
  tradeTerms: optionalTradeText(20),
  customsNo: optionalTradeText(60),
  portOfLoading: optionalTradeText(80),
  portOfDischarge: optionalTradeText(80),
} as const;

/**
 * Helper function to transform empty address objects to undefined
 */
const transformEmptyAddress = (address: unknown): unknown => {
  if (!address || typeof address !== "object") return address;
  
  const addr = address as Record<string, unknown>;
  const hasRequiredFields = 
    addr.street && typeof addr.street === "string" && addr.street.trim() !== "" &&
    addr.city && typeof addr.city === "string" && addr.city.trim() !== "" &&
    addr.zipCode && typeof addr.zipCode === "string" && addr.zipCode.trim() !== "" &&
    addr.country && typeof addr.country === "string" && addr.country.trim() !== "";
  
  return hasRequiredFields ? address : undefined;
};

/**
 * Create order schema
 */
export const createOrderSchema = z.object({
  clientId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  shippingAddress: z.preprocess(transformEmptyAddress, shippingAddressSchema.optional()),
  billingAddress: z.preprocess(transformEmptyAddress, billingAddressSchema.optional()),
  // REQ-0236 — tax/shipping/discount computed server-side; not accepted from client
  notes: z.string().optional(),
  // Export trade fields
  ...tradeFieldsShape,
});

/**
 * Update order schema
 */
export const updateOrderSchema = z.object({
  status: z
    .enum([
      "draft",
      "pending",
      "approved",
      "rejected",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded", "partial"]).optional(),
  shippingAddress: shippingAddressSchema.optional(),
  billingAddress: billingAddressSchema.optional(),
  trackingNumber: z.string().optional(),
  /** REQ-0146 — admin manual tracking persists carrier */
  trackingCarrier: z
    .enum(["usps", "ups", "fedex", "dhl", "other"])
    .optional(),
  trackingUrl: z
    .string()
    .url("Invalid tracking URL")
    .optional()
    .or(z.literal("")),
  estimatedDelivery: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  shippedAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  deliveredAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  cancelledAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  notes: z.string().optional(),
  // Export trade fields
  ...tradeFieldsShape,
});

/**
 * Create order form data type
 */
export type CreateOrderFormData = z.infer<typeof createOrderSchema>;

/**
 * Approve / reject an order (trade approval flow)
 */
export const orderApprovalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().max(1000).optional(),
});

export type OrderApprovalFormData = z.infer<typeof orderApprovalSchema>;

/**
 * Update order form data type
 */
export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>;
