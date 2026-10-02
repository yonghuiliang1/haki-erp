/**
 * Single Sales Performance API Route Handler
 * PATCH /api/sales-performance/:id — adjust the attribution month of an entry.
 * The attribution period may differ from the order date (e.g. a shipment that
 * lands in December belongs to December's result), so the change is recorded
 * with a reason and the adjusting user.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { updateSalesPerformanceSchema } from "@/lib/validations";
import { createAuditLog } from "@/prisma/audit-log";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = ["admin", "finance"];
    if (!allowed.includes(session.role ?? "")) {
      return NextResponse.json(
        { error: "Only admin or finance users can adjust performance" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateSalesPerformanceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.performance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Performance entry not found" },
        { status: 404 },
      );
    }

    const { month, year, notes } = validationResult.data;
    const updated = await prisma.performance.update({
      where: { id },
      data: {
        month,
        year,
        notes: notes?.trim() ? notes.trim() : null,
        updatedAt: new Date(),
        updatedBy: session.id,
      },
    });

    createAuditLog({
      userId: session.id,
      action: "update",
      entityType: "order",
      entityId: existing.orderId,
      details: {
        performanceId: id,
        attributionFrom: `${existing.year}-${String(existing.month).padStart(2, "0")}`,
        attributionTo: `${year}-${String(month).padStart(2, "0")}`,
      },
    }).catch(() => {});

    return NextResponse.json({
      id: updated.id,
      orderId: updated.orderId,
      salesId: updated.salesId,
      month: updated.month,
      year: updated.year,
      amount: updated.amount,
      notes: updated.notes,
    });
  } catch (error) {
    logger.error("Error updating sales performance:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update sales performance",
      },
      { status: 500 },
    );
  }
}