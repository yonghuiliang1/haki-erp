"use client";

/**
 * Approval history card — append-only approve/reject trail for a trade order.
 * Reads order.approvals from the shared detail fetch, so the store and admin
 * detail screens reuse this one card instead of each building their own.
 */

import React from "react";
import { History } from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { ClientDateTime, DataSlotPulse } from "@/components/shared";
import { ReviewStatusBadge } from "@/lib/ui/semantic-badges";
import { useT } from "@/lib/i18n/locale-context";
import { GlassCard, variantConfig } from "./order-detail-primitives";

export type OrderApprovalHistoryCardProps = {
  order?: Order;
  dataLoading: boolean;
  className?: string;
};

export function OrderApprovalHistoryCard({
  order,
  dataLoading,
  className,
}: OrderApprovalHistoryCardProps) {
  const t = useT();
  const approvals = order?.approvals ?? [];

  // Nothing to show until the order has been reviewed at least once.
  if (!dataLoading && approvals.length === 0) return null;

  return (
    <GlassCard variant="violet" className={className}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            "p-2 rounded-xl border",
            variantConfig.violet.iconBg,
            "dark:border-violet-400/30 dark:bg-violet-500/20",
          )}
        >
          <History className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
          {t("Approval History")}
        </h3>
      </div>
      <ul className="space-y-2">
        {approvals.length === 0 && dataLoading && (
          <li className="p-2">
            <DataSlotPulse variant="text-sm" className="w-40" />
          </li>
        )}
        {approvals.map((approval) => (
          <li
            key={approval.id}
            className="p-2 rounded-xl bg-gradient-to-r from-violet-100/40 via-violet-50/20 to-transparent dark:from-violet-500/10 dark:via-violet-500/5 dark:to-transparent border border-violet-200/30 dark:border-violet-400/10 space-y-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 min-w-0">
                <ReviewStatusBadge
                  status={
                    approval.action === "approve" ? "approved" : "rejected"
                  }
                  size="detail"
                />
                <span className="text-sm text-gray-700 dark:text-white truncate">
                  {approval.approver?.name || approval.approver?.email || "—"}
                </span>
              </span>
              <ClientDateTime
                date={new Date(approval.createdAt)}
                semantic="updated"
                className="text-xs"
              />
            </div>
            {approval.comment && (
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {approval.comment}
              </p>
            )}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}