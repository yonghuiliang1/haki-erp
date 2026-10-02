/**
 * Receive Purchase Order API Route Handler
 * POST /api/purchase-orders/:id/receive — move the ordered stock into inventory.
 * Stock grows in the catalog and, when a receiving warehouse is set, in that
 * warehouse allocation too.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { receivePurchaseOrder } from "@/prisma/purchase-order";
import { createAuditLog } from "@/prisma/audit-log";
import { invalidateCache, cacheKeys } from "@/lib/cache";
import { checkLowStockForProducts } from "@/lib/notifications/stock-alerts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Receiving is a stock movement: admin, purchase, or warehouse.
    const allowed = ["admin", "purchase", "warehouse"];
    if (!allowed.includes(session.role ?? "")) {
      return NextResponse.json(
        { error: "Only admin, purchase, or warehouse users can receive orders" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const order = await receivePurchaseOrder(id, session.id);

    createAuditLog({
      userId: session.id,
      action: "update",
      entityType: "purchase_order",
      entityId: id,
      details: {
        purchaseNo: order?.purchaseNo,
        statusTo: "received",
      },
    }).catch(() => {});

    // Stock changed → refresh product + allocation caches.
    await Promise.all([
      invalidateCache(cacheKeys.products.pattern),
      invalidateCache(cacheKeys.stockAllocation.pattern),
    ]).catch((error) => {
      logger.error("Failed to invalidate caches after receiving order:", error);
    });

    // Receiving raises stock; still re-check so alerts clear state stays honest.
    checkLowStockForProducts(
      (order?.items ?? []).map((item) => item.productId),
    ).catch((error) => {
      logger.error("Low-stock check after receiving failed:", error);
    });

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to receive purchase order";
    if (message === "Purchase order not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    // Already received / cancelled — the order state conflicts with the call.
    if (
      message === "Purchase order has already been received" ||
      message === "Cancelled purchase orders cannot be received"
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    logger.error("Error receiving purchase order:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}