/**
 * Sales Performance API Route Handler
 * GET /api/sales-performance — monthly attribution entries plus per-sales summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getSalesPerformance } from "@/lib/server/sales-performance-data";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Everyone in the money chain can read performance; only admin/finance adjust it.
    const allowed = ["admin", "finance", "sales"];
    if (!allowed.includes(session.role ?? "")) {
      return NextResponse.json(
        { error: "You are not allowed to view sales performance" },
        { status: 403 },
      );
    }

    const data = await getSalesPerformance();
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error fetching sales performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales performance" },
      { status: 500 },
    );
  }
}