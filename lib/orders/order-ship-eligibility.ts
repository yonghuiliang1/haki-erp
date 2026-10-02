/**
 * REQ-0211 — Shared gate for Auto Generate / Ship Order UI + API.
 * Approved (or legacy confirmed|processing) OR money collected (partial|paid).
 * Not draft/pending/rejected unpaid / cancelled.
 */

export type OrderShipEligibilitySource = {
  status?: string | null;
  paymentStatus?: string | null;
  trackingNumber?: string | null;
};

export function canGenerateShippingLabel(
  order: OrderShipEligibilitySource | null | undefined,
): boolean {
  if (!order) return false;
  if (order.status === "cancelled") return false;
  if (order.status === "shipped" || order.status === "delivered") return false;
  if (order.trackingNumber) return false;
  return (
    order.status === "approved" ||
    order.status === "confirmed" ||
    order.status === "processing" ||
    order.paymentStatus === "partial" ||
    order.paymentStatus === "paid"
  );
}

/** Short copy under Shipping & Tracking when Auto Generate is blocked. */
export function shippingLabelBlockedReason(
  order: OrderShipEligibilitySource | null | undefined,
): string | null {
  if (!order || canGenerateShippingLabel(order)) return null;
  if (order.status === "cancelled") {
    return "Cancelled orders cannot be shipped.";
  }
  if (order.trackingNumber || order.status === "shipped") {
    return null;
  }
  return "Approve the order or collect payment before generating a shipping label.";
}
