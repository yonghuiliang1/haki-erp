/**
 * Purchase Order CSV Export
 * GET /api/purchase-orders/:id/export — line-item CSV download for the order.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getPurchaseOrderById } from "@/prisma/purchase-order";

/** Escape a cell for CSV (quotes, commas, newlines). */
function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await getPurchaseOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }

    const lines: string[] = [];
    lines.push(
      ["Purchase No.", "Supplier", "Status", "Currency", "Expected At"]
        .map(csvCell)
        .join(","),
    );
    lines.push(
      [
        order.purchaseNo,
        order.supplierName ?? "",
        order.status,
        order.currency ?? "",
        order.expectedAt
          ? new Date(order.expectedAt).toISOString().split("T")[0]
          : "",
      ]
        .map(csvCell)
        .join(","),
    );
    lines.push("");
    lines.push(
      ["SKU", "Product", "Quantity", "Unit Cost", "Subtotal"]
        .map(csvCell)
        .join(","),
    );
    for (const item of order.items) {
      lines.push(
        [
          item.sku ?? "",
          item.productName,
          item.quantity,
          item.unitCost,
          item.subtotal,
        ]
          .map(csvCell)
          .join(","),
      );
    }
    lines.push("");
    lines.push(["", "", "", "Total", order.total].map(csvCell).join(","));

    // BOM keeps Excel on UTF-8 for any non-ASCII product names.
    const csv = `\uFEFF${lines.join("\r\n")}`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${order.purchaseNo}.csv"`,
      },
    });
  } catch (error) {
    logger.error("Error exporting purchase order:", error);
    return NextResponse.json(
      { error: "Failed to export purchase order" },
      { status: 500 },
    );
  }
}