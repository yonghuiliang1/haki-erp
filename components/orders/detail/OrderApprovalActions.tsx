"use client";

/**
 * REQ-0241 — Shared approve / reject controls for a pending trade order.
 *
 * Self-contained on purpose: the mutation and the review dialog live here, so
 * the store and admin detail screens both pick up the flow by reusing this one
 * component instead of wiring their own copy. Approval reserves stock
 * server-side; a shortage comes back as an error toast from the shared hook.
 */

import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { glassDetailFooterButtonClass } from "@/components/shared";
import { useApproveOrder } from "@/hooks/queries";
import type { Order } from "@/types";

type ReviewAction = "approve" | "reject";

export type OrderApprovalActionsProps = {
  order: Order;
  /** Reviewing is an admin decision; sales only submits orders. */
  canReview: boolean;
  disabled?: boolean;
};

export function OrderApprovalActions({
  order,
  canReview,
  disabled = false,
}: OrderApprovalActionsProps) {
  const approveOrderMutation = useApproveOrder();
  const [pendingReview, setPendingReview] = useState<ReviewAction | null>(null);
  const [comment, setComment] = useState("");

  // Only a pending order awaits a decision, and only an admin can give one.
  if (!canReview || order.status !== "pending") return null;

  const isSubmitting = approveOrderMutation.isPending;
  const isApproving = pendingReview === "approve";

  const closeDialog = () => {
    if (isSubmitting) return;
    setPendingReview(null);
    setComment("");
  };

  const submitReview = () => {
    if (!pendingReview) return;
    approveOrderMutation.mutate(
      {
        id: order.id,
        action: pendingReview,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPendingReview(null);
          setComment("");
        },
      },
    );
  };

  return (
    <>
      <Button
        onClick={() => setPendingReview("approve")}
        disabled={disabled}
        className={glassDetailFooterButtonClass("emerald")}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Approve
      </Button>

      <Button
        onClick={() => setPendingReview("reject")}
        disabled={disabled}
        className={glassDetailFooterButtonClass("rose")}
      >
        <XCircle className="h-4 w-4 shrink-0" />
        Reject
      </Button>

      <Dialog
        open={pendingReview !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isApproving ? "Approve Order" : "Reject Order"}
            </DialogTitle>
            <DialogDescription>
              {isApproving
                ? `Approving ${order.orderNumber} reserves stock for every line.`
                : `${order.orderNumber} goes back to sales for revision.`}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={
              isApproving
                ? "Optional note for the approval record"
                : "Reason for rejection (optional)"
            }
            rows={3}
            disabled={isSubmitting}
          />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={isSubmitting}>
              {isSubmitting
                ? "Submitting…"
                : isApproving
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}