/**
 * Sales performance query hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  SalesPerformanceData,
  UpdateSalesPerformanceInput,
} from "@/types";

/** Monthly attribution entries plus per-salesperson summary. */
export function useSalesPerformance(initialData?: SalesPerformanceData) {
  return useQuery<SalesPerformanceData>({
    queryKey: queryKeys.salesPerformance.lists(),
    queryFn: async () => {
      const response = await apiClient.salesPerformance.getAll();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/** Adjust the attribution month of one performance entry. */
export function useUpdateSalesPerformance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSalesPerformanceInput;
    }) => {
      const response = await apiClient.salesPerformance.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.salesPerformance.all,
      });
      toast({
        title: "Attribution updated",
        description: "The performance entry moved to its new month.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description:
          getErrorMessage(error) || "Failed to update the attribution month.",
        variant: "destructive",
      });
    },
  });
}