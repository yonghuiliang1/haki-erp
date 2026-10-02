/**
 * Finance Report API Route Handler
 * GET /api/finance/report — monthly sales / purchase cost / profit plus rankings.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getFinanceReport } from "@/lib/server/finance-report-data";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Money views are for the roles that own the numbers.
    const allowed = ["admin", "finance"];
    if (!allowed.includes(session.role ?? "")) {
      return NextResponse.json(
        { error: "Only admin or finance users can view the finance report" },
        { status: 403 },
      );
    }

    const report = await getFinanceReport();
    return NextResponse.json(report);
  } catch (error) {
    logger.error("Error building finance report:", error);
    return NextResponse.json(
      { error: "Failed to build finance report" },
      { status: 500 },
    );
  }
}