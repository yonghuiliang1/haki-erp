/**
 * Customer Prisma Utilities
 * Export customer master data used by the order form picker and detail cards.
 */

import { prisma } from "@/prisma/client";

/**
 * List active export customers for pickers.
 * Sorted by company name so dropdown order stays stable across pages.
 */
export async function getCustomers() {
  return prisma.customer.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
  });
}