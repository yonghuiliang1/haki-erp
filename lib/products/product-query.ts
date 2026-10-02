/**
 * Shared Prisma where clauses for Product queries.
 * Catalog/list UIs must exclude soft-deleted products (deletedAt set).
 */

import type { Prisma } from "@prisma/client";

/**
 * Active catalog products: not archived.
 * A row is archived when deletedAt carries a timestamp; null means active.
 */
export const productNotDeletedWhere = {
  deletedAt: null,
} satisfies Prisma.ProductWhereInput;

/**
 * Merge catalog filter with additional where fields (userId, supplierId, id, etc.).
 */
export function mergeProductListWhere(
  where: Prisma.ProductWhereInput,
): Prisma.ProductWhereInput {
  return {
    AND: [productNotDeletedWhere, where],
  };
}

/** True when product row is archived (soft-deleted). */
export function isProductArchived(
  product: { deletedAt?: Date | null },
): boolean {
  return product.deletedAt != null;
}
