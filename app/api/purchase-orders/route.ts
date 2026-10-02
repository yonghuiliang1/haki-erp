/**
 * Purchase Orders API Route Handler
 * GET  /api/purchase-orders — list purchase orders with supplier names
 * POST /api/purchase-orders — create a purchase order (pending)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createPurchaseOrderSchema } from "@/lib/validations";
import {
  createPurchaseOrder,
  getPurchaseOrders,
} from "@/prisma/purchase-order";
import { createAuditLog } from "@/prisma/audit-log";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await getPurchaseOrders();
    return NextResponse.json(orders);
  } catch (error) {
    logger.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Purchasing is limited to the roles that place supplier orders.
    if (session.role !== "admin" && session.role !== "purchase") {
      return NextResponse.json(
        { error: "Only admin or purchase users can create purchase orders" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = createPurchaseOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const data = validationResult.data;
    const order = await createPurchaseOrder(
      {
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        currency: data.currency,
        expectedAt:
          data.expectedAt && data.expectedAt !== ""
            ? new Date(data.expectedAt)
            : undefined,
        notes: data.notes,
        items: data.items,
      },
      session.id,
    );

    createAuditLog({
      userId: session.id,
      action: "create",
      entityType: "purchase_order",
      entityId: order.id,
      details: {
        purchaseNo: order.purchaseNo,
        supplierId: order.supplierId,
        total: order.total,
      },
    }).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    logger.error("Error creating purchase order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create purchase order",
      },
      { status: 500 },
    );
  }
}