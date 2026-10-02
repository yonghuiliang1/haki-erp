/**
 * Inventory Board API Route Handler
 * GET /api/inventory/board — on-hand / reserved / available per product plus summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getInventoryBoard } from "@/lib/server/inventory-board-data";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Stock levels are internal data — external portals have their own views.
    const allowed = ["admin", "sales", "finance", "warehouse", "purchase"];
    if (!allowed.includes(session.role ?? "")) {
      return NextResponse.json(
        { error: "You are not allowed to view the stock board" },
        { status: 403 },
      );
    }

    const board = await getInventoryBoard();
    return NextResponse.json(board);
  } catch (error) {
    logger.error("Error fetching inventory board:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory board" },
      { status: 500 },
    );
  }
}