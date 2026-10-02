/**
 * Customers API Route Handler
 * GET /api/customers — export customer master data for order form pickers.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getCustomers } from "@/prisma/customer";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Customer master data (contacts, phones) is internal to the company.
    const allowed = ["admin", "sales", "finance", "warehouse", "purchase"];
    if (!allowed.includes(session.role ?? "")) {
      return NextResponse.json(
        { error: "You are not allowed to view customers" },
        { status: 403 },
      );
    }

    const customers = await getCustomers();
    return NextResponse.json(
      customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        country: customer.country,
        contact: customer.contact,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: customer.status,
        notes: customer.notes,
      })),
    );
  } catch (error) {
    logger.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}