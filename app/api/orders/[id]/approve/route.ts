/**
 * Order Approval API Route Handler
 * POST /api/orders/:id/approve — approve or reject a pending trade order.
 *
 * Approving reserves stock (allocations when a warehouse was picked, catalog
 * otherwise) and records an Approval row; rejecting just records the decision.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { updateOrder } from "@/prisma/order";
import { createAuditLog } from "@/prisma/audit-log";
import { invalidateOnOrderChange } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createOrderNotification } from "@/lib/notifications/in-app";
import { checkLowStockForProducts } from "@/lib/notifications/stock-alerts";
import { orderApprovalSchema } from "@/lib/validations";
import { getOrderLineCatalogAvailable } from "@/lib/orders/order-line-stock-validation";
import { productRequiresWarehousePick } from "@/lib/products/stock-allocation-order-sync";

/** Only a pending order can be approved or rejected. */
const PENDING_STATUS = "pending";

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

    // Approval is an admin decision; sales can only submit.
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only an administrator can approve or reject orders" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validationResult = orderApprovalSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { action, comment } = validationResult.data;
    const isApprove = action === "approve";

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== PENDING_STATUS) {
      return NextResponse.json(
        {
          error: `Order is ${order.status}; only ${PENDING_STATUS} orders can be reviewed`,
        },
        { status: 409 },
      );
    }

    // Approving locks stock, so confirm every line still has enough available.
    // This runs before any write so a shortage leaves the order untouched.
    if (isApprove) {
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.deletedAt != null) {
          return NextResponse.json(
            {
              error: `Product ${item.productName} is no longer available`,
            },
            { status: 409 },
          );
        }

        const productQty = Number(product.quantity);
        const productReserved = Number(product.reservedQuantity ?? 0);
        const needsPick = await productRequiresWarehousePick(
          item.productId,
          product.userId,
        );

        let available: number;
        if (needsPick) {
          const allocationRows = await prisma.stockAllocation.findMany({
            where: { productId: item.productId },
            select: { reservedQuantity: true },
          });
          available = getOrderLineCatalogAvailable(
            productQty,
            productReserved,
            allocationRows.map((row) => ({
              reservedQuantity: Number(row.reservedQuantity ?? 0),
            })),
          );
        } else {
          available = productQty - productReserved;
        }

        if (available < item.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${item.productName}. Available: ${available}, Requested: ${item.quantity}`,
            },
            { status: 409 },
          );
        }
      }
    }

    const updated = await updateOrder(
      id,
      {
        status: isApprove ? "approved" : "rejected",
        ...(isApprove
          ? { approvedById: session.id, approvedAt: new Date() }
          : {}),
      },
      order.userId,
    );

    await prisma.approval.create({
      data: {
        orderId: id,
        approverId: session.id,
        action,
        comment: comment?.trim() ? comment.trim() : null,
      },
    });

    createAuditLog({
      userId: session.id,
      action: "update",
      entityType: "order",
      entityId: id,
      details: {
        orderNumber: order.orderNumber,
        statusFrom: PENDING_STATUS,
        statusTo: updated.status,
        approvalAction: action,
      },
    }).catch(() => {});

    await invalidateOnOrderChange();

    // Approval locked stock — alert when a line fell to its reorder point.
    if (isApprove) {
      checkLowStockForProducts(order.items.map((item) => item.productId)).catch(
        (error) => {
          logger.error("Low-stock check after approval failed:", error);
        },
      );
    }

    createOrderNotification(
      "order_status_update",
      order.orderNumber,
      `Order ${order.orderNumber} was ${isApprove ? "approved" : "rejected"}`,
      session.id,
      order.id,
    ).catch((error) => {
      logger.error("Failed to create approval notification:", error);
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      approvedById: updated.approvedById,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
    });
  } catch (error) {
    logger.error("Error reviewing order:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to review order",
      },
      { status: 500 },
    );
  }
}