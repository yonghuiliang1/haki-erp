/**
 * Sales performance validation schemas
 */

import { z } from "zod";

/** Adjust the attribution period of a performance entry. */
export const updateSalesPerformanceSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  notes: z.string().max(500).optional(),
});

export type UpdateSalesPerformanceFormData = z.infer<
  typeof updateSalesPerformanceSchema
>;