"use client";

/**
 * Export trade fields shared by OrderDialog create + edit modes.
 * Reads and writes the surrounding react-hook-form context, so one block serves
 * both forms instead of duplicating seven inputs in each.
 */

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormNumberField } from "@/components/forms";
import { useCustomers } from "@/hooks/queries";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_SUB_LABEL,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";

/** Settlement currencies offered for export orders. */
export const ORDER_CURRENCIES = ["USD", "EUR", "CNY"] as const;
/** Incoterms used in export quotes. */
export const ORDER_TRADE_TERMS = ["FOB", "CIF", "EXW", "FCA", "DDP"] as const;

export type OrderTradeFieldsProps = {
  /** Deferred selects wait for the dialog animation before mounting */
  dialogOpen: boolean;
};

/** Shared placeholder row so selects render a stable value before mounting */
function TradeSelectPlaceholder({ label }: { label: string }) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
        DIALOG_FORM_FIELD_VIOLET,
      )}
      aria-hidden
    >
      {label}
    </div>
  );
}

export function OrderTradeFields({ dialogOpen }: OrderTradeFieldsProps) {
  const { control, setValue } = useFormContext();
  const { data: customers = [] } = useCustomers();
  const t = useT();

  const customerId = useWatch({ control, name: "customerId" }) as
    | string
    | undefined;
  const currency = useWatch({ control, name: "currency" }) as
    | string
    | undefined;
  const tradeTerms = useWatch({ control, name: "tradeTerms" }) as
    | string
    | undefined;

  const customerLabel =
    customers.find((customer) => customer.id === customerId)?.name ??
    t("Select Customer");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {/* Customer master record (name · country in options) */}
      <div className="flex flex-col gap-2 sm:col-span-2">
        <label className={cn("text-sm", DIALOG_FORM_SUB_LABEL)}>
          {t("Customer")}
        </label>
        <DeferredSelectGate
          enabled={dialogOpen}
          placeholder={<TradeSelectPlaceholder label={customerLabel} />}
        >
          {({ selectRemountKey }) => (
            <Select
              key={selectRemountKey}
              value={customerId ?? ""}
              onValueChange={(value) =>
                setValue("customerId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}
              >
                <SelectValue placeholder={t("Select Customer")} />
              </SelectTrigger>
              <SelectContent
                className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                position="popper"
                sideOffset={5}
                align="start"
              >
                {customers.map((customer) => (
                  <SelectItem
                    key={customer.id}
                    value={customer.id}
                    className={DIALOG_SELECT_ITEM_CLASS}
                  >
                    {customer.name} · {customer.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </DeferredSelectGate>
      </div>

      {/* Settlement currency */}
      <div className="flex flex-col gap-2">
        <label className={cn("text-sm", DIALOG_FORM_SUB_LABEL)}>{t("Currency")}</label>
        <DeferredSelectGate
          enabled={dialogOpen}
          placeholder={
            <TradeSelectPlaceholder label={currency ?? t("Select")} />
          }
        >
          {({ selectRemountKey }) => (
            <Select
              key={selectRemountKey}
              value={currency ?? ""}
              onValueChange={(value) =>
                setValue("currency", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}
              >
                <SelectValue placeholder={t("Select Currency")} />
              </SelectTrigger>
              <SelectContent
                className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                position="popper"
                sideOffset={5}
                align="start"
              >
                {ORDER_CURRENCIES.map((code) => (
                  <SelectItem
                    key={code}
                    value={code}
                    className={DIALOG_SELECT_ITEM_CLASS}
                  >
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </DeferredSelectGate>
      </div>

      {/* Exchange rate against CNY */}
      <FormNumberField
        name="exchangeRate"
        label={t("Exchange Rate (CNY)")}
        placeholder="7.05"
        thousandSeparator={false}
        decimalScale={4}
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />

      {/* Incoterms */}
      <div className="flex flex-col gap-2">
        <label className={cn("text-sm", DIALOG_FORM_SUB_LABEL)}>
          {t("Trade Terms")}
        </label>
        <DeferredSelectGate
          enabled={dialogOpen}
          placeholder={
            <TradeSelectPlaceholder label={tradeTerms ?? t("Select")} />
          }
        >
          {({ selectRemountKey }) => (
            <Select
              key={selectRemountKey}
              value={tradeTerms ?? ""}
              onValueChange={(value) =>
                setValue("tradeTerms", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}
              >
                <SelectValue placeholder={t("Select Trade Terms")} />
              </SelectTrigger>
              <SelectContent
                className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                position="popper"
                sideOffset={5}
                align="start"
              >
                {ORDER_TRADE_TERMS.map((term) => (
                  <SelectItem
                    key={term}
                    value={term}
                    className={DIALOG_SELECT_ITEM_CLASS}
                  >
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </DeferredSelectGate>
      </div>

      {/* Customs declaration number */}
      <FormField
        name="customsNo"
        label={t("Customs No.")}
        placeholder="HG-202603-1201"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />

      {/* Ports */}
      <FormField
        name="portOfLoading"
        label={t("Port of Loading")}
        placeholder="Ningbo"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />
      <FormField
        name="portOfDischarge"
        label={t("Port of Discharge")}
        placeholder="Los Angeles"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />
    </div>
  );
}