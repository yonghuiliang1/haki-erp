/**
 * Finance report query hooks
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { FinanceReport } from "@/types";

/** Monthly sales / purchase cost / profit plus customer and product rankings. */
export function useFinanceReport(initialData?: FinanceReport) {
  return useQuery<FinanceReport>({
    queryKey: queryKeys.finance.report(),
    queryFn: async () => {
      const response = await apiClient.finance.getReport();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}