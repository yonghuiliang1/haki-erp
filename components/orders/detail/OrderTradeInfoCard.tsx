"use client";

/**
 * Export trade information card for the order detail pages.
 * Shows customer master data plus currency / incoterms / customs / ports.
 * Hidden entirely when the order carries no trade fields, so legacy orders
 * keep their existing layout.
 */

import React from "react";
import {
  Anchor,
  Building2,
  Coins,
  FileCheck2,
  Globe2,
  Handshake,
  MapPin,
} from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { GlassCard, DetailInfoRow, variantConfig } from "./order-detail-primitives";

export type OrderTradeInfoCardProps = {
  order?: Order;
  dataLoading: boolean;
  className?: string;
};

export function OrderTradeInfoCard({
  order,
  dataLoading,
  className,
}: OrderTradeInfoCardProps) {
  const hasTradeInfo =
    !!order &&
    (!!order.customer ||
      !!order.currency ||
      order.exchangeRate != null ||
      !!order.tradeTerms ||
      !!order.customsNo ||
      !!order.portOfLoading ||
      !!order.portOfDischarge);

  if (!dataLoading && !hasTradeInfo) return null;

  const customer = order?.customer;
  const contactLine = [customer?.contact, customer?.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <GlassCard variant="cyan" className={className}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            "p-2 rounded-xl border",
            variantConfig.cyan.iconBg,
            "dark:border-cyan-400/30 dark:bg-cyan-500/20",
          )}
        >
          <Globe2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
          Export Trade
        </h3>
      </div>
      <div className="space-y-2">
        {customer && (
          <DetailInfoRow icon={Building2} label="Customer:" tone="cyan">
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
              <span>{customer.name}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {customer.country}
              </span>
              {contactLine && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  · {contactLine}
                </span>
              )}
            </span>
          </DetailInfoRow>
        )}
        {order?.currency && (
          <DetailInfoRow icon={Coins} label="Currency:" tone="amber">
            <span className="inline-flex flex-wrap items-center gap-x-2 min-w-0">
              <span>{order.currency}</span>
              {order.exchangeRate != null && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  @ {Number(order.exchangeRate)} CNY
                </span>
              )}
            </span>
          </DetailInfoRow>
        )}
        {order?.tradeTerms && (
          <DetailInfoRow icon={Handshake} label="Trade Terms:" tone="violet">
            {order.tradeTerms}
          </DetailInfoRow>
        )}
        {order?.customsNo && (
          <DetailInfoRow icon={FileCheck2} label="Customs No.:" tone="teal">
            <span className="font-mono text-xs">{order.customsNo}</span>
          </DetailInfoRow>
        )}
        {order?.portOfLoading && (
          <DetailInfoRow icon={Anchor} label="Port of Loading:" tone="sky">
            {order.portOfLoading}
          </DetailInfoRow>
        )}
        {order?.portOfDischarge && (
          <DetailInfoRow icon={MapPin} label="Port of Discharge:" tone="emerald">
            {order.portOfDischarge}
          </DetailInfoRow>
        )}
      </div>
    </GlassCard>
  );
}