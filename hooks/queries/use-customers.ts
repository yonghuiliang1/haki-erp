/**
 * Export customer query hooks
 * TanStack Query hooks for customer master data.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { ExportCustomer } from "@/types";

/**
 * Fetch active export customers (order form picker and trade card).
 */
export function useCustomers(initialData?: ExportCustomer[]) {
  return useQuery<ExportCustomer[]>({
    queryKey: queryKeys.customers.lists(),
    queryFn: async () => {
      const response = await apiClient.customers.getAll();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}