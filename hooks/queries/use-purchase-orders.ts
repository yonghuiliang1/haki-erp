/**
 * Purchase order query hooks
 * TanStack Query hooks for supplier purchase orders.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  queryKeys,
  withInitialData,
  invalidateAfterOrderGraphChange,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type { PurchaseOrder, CreatePurchaseOrderInput } from "@/types";

/** List purchase orders with supplier names. */
export function usePurchaseOrders(initialData?: PurchaseOrder[]) {
  return useQuery<PurchaseOrder[]>({
    queryKey: queryKeys.purchaseOrders.lists(),
    queryFn: async () => {
      const response = await apiClient.purchaseOrders.getAll();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/** Create a purchase order (starts as pending). */
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderInput) => {
      const response = await apiClient.purchaseOrders.create(data);
      return response.data;
    },
    onSuccess: (order: PurchaseOrder) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      toast({
        title: "Purchase order created",
        description: `${order.purchaseNo} is pending receipt.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Create failed",
        description:
          getErrorMessage(error) || "Failed to create purchase order.",
        variant: "destructive",
      });
    },
  });
}

/** Receive a purchase order — stock flows into inventory. */
export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.purchaseOrders.receive(id);
      return response.data;
    },
    onSuccess: (order: PurchaseOrder) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      // Received stock changes products/allocations shown across the app.
      invalidateAfterOrderGraphChange(queryClient);
      toast({
        title: "Order received",
        description: `Stock for ${order.purchaseNo} has been added to inventory.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Receive failed",
        description:
          getErrorMessage(error) || "Failed to receive purchase order.",
        variant: "destructive",
      });
    },
  });
}