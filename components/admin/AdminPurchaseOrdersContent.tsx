"use client";

/**
 * Purchase orders list — create orders, receive them into stock, export CSV.
 */

import React, { useState } from "react";
import {
  ClipboardList,
  Download,
  Loader2,
  PackageCheck,
  Plus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ClientDate,
  PageContentWrapper,
  PageSectionHeader,
} from "@/components/shared";
import { AlertDialogWrapper } from "@/components/dialogs";
import PurchaseOrderDialog from "@/components/purchase/PurchaseOrderDialog";
import {
  usePurchaseOrders,
  useReceivePurchaseOrder,
} from "@/hooks/queries";
import { apiClient } from "@/lib/api";
import { isDataSlotUnsettled } from "@/lib/react-query";
import { cn } from "@/lib/utils";
import { formatStableCurrency } from "@/lib/format";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types";

export type AdminPurchaseOrdersContentProps = {
  initialOrders?: PurchaseOrder[];
};

const STATUS_BADGE_CLASS: Record<PurchaseOrderStatus, string> = {
  draft:
    "border-slate-400/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  pending:
    "border-orange-400/30 bg-orange-500/10 text-orange-600 dark:text-orange-300",
  approved: "border-sky-400/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
  received:
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  cancelled: "border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300",
};

function PurchaseStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 h-6 text-[10px] capitalize",
        STATUS_BADGE_CLASS[status] ??
          "border-gray-400/30 bg-gray-500/10 text-gray-600 dark:text-gray-300",
      )}
    >
      {status}
    </span>
  );
}

export default function AdminPurchaseOrdersContent({
  initialOrders,
}: AdminPurchaseOrdersContentProps) {
  const ordersQuery = usePurchaseOrders(initialOrders);
  const orders = ordersQuery.data ?? initialOrders ?? [];
  const dataLoading = isDataSlotUnsettled(ordersQuery, initialOrders);
  const receiveMutation = useReceivePurchaseOrder();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(
    null,
  );

  const handleReceive = () => {
    if (!receiveTarget) return;
    receiveMutation.mutate(receiveTarget.id, {
      onSettled: () => setReceiveTarget(null),
    });
  };

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h2"
          icon={ClipboardList}
          tone="teal"
          title="Purchase Orders"
          description="Order stock from suppliers and receive it into inventory."
        />

        <div className="flex justify-end">
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/40 via-cyan-500/30 to-cyan-500/20 text-white shadow-[0_15px_35px_rgba(6,182,212,0.35)] backdrop-blur-md"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Purchase Order
          </Button>
        </div>

        <div className="rounded-[28px] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const isReceiving =
                  receiveMutation.isPending &&
                  receiveTarget?.id === order.id;
                const canReceive =
                  order.status !== "received" && order.status !== "cancelled";
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-gray-700 dark:text-white">
                      {order.purchaseNo}
                      <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                        {order.items.length} line
                        {order.items.length === 1 ? "" : "s"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 dark:text-white">
                      {order.supplierName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <PurchaseStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatStableCurrency(Number(order.total))}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {order.expectedAt ? (
                        <ClientDate
                          date={new Date(order.expectedAt)}
                          semantic="scheduled"
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {order.receivedAt ? (
                        <ClientDate
                          date={new Date(order.receivedAt)}
                          semantic="completed"
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={apiClient.purchaseOrders.exportCsvUrl(order.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 text-xs text-sky-600 dark:text-sky-300 hover:bg-sky-500/20"
                          title="Export line items as CSV"
                        >
                          <Download className="h-3.5 w-3.5" />
                          CSV
                        </a>
                        {canReceive && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={dataLoading || isReceiving}
                            onClick={() => setReceiveTarget(order)}
                            className="h-8 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 text-xs text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20"
                          >
                            {isReceiving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <PackageCheck className="h-3.5 w-3.5" />
                            )}
                            Receive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!dataLoading && orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No purchase orders yet — create the first one from a
                    supplier.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PurchaseOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {receiveTarget && (
        <AlertDialogWrapper
          open={receiveTarget !== null}
          onOpenChange={(open) => {
            if (!open) setReceiveTarget(null);
          }}
          title="Receive Purchase Order"
          description={`Receiving ${receiveTarget.purchaseNo} adds ${receiveTarget.items.length} line(s) to inventory. This cannot be undone.`}
          actionLabel="Receive"
          actionLoadingLabel="Receiving..."
          isLoading={receiveMutation.isPending}
          onAction={handleReceive}
          onCancel={() => setReceiveTarget(null)}
        />
      )}
    </PageContentWrapper>
  );
}