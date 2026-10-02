"use client";

/**
 * Payment Button Component
 * Initiates Stripe Checkout for orders or invoices
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { useCreateCheckout } from "@/hooks/queries";
import { CreditCard, Loader2 } from "lucide-react";
import type { CheckoutType } from "@/types";
import { formatStableCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";

interface PaymentButtonProps {
  type: CheckoutType;
  id: string;
  amount?: number;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function PaymentButton({
  type,
  id,
  amount,
  disabled,
  variant = "default",
  size = "default",
  className,
}: PaymentButtonProps) {
  const checkoutMutation = useCreateCheckout();
  const t = useT();

  const handlePayment = () => {
    checkoutMutation.mutate({ type, id });
  };

  const isLoading = checkoutMutation.isPending;

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("Processing...")}
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {amount
            ? t("Pay {amount}", { amount: formatStableCurrency(amount) })
            : t("Pay Now")}
        </>
      )}
    </Button>
  );
}
