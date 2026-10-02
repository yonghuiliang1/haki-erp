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