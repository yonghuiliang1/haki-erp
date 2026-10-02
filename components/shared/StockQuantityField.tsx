"use client";

/**
 * Stock quantity input with live max hint + inline validation (allocate / transfer dialogs).
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DIALOG_FORM_ERROR_TEXT,
  DIALOG_FORM_SUCCESS_TEXT,
} from "@/components/shared/dialog-edge-scroll";
import { useT } from "@/lib/i18n/locale-context";
import { interpolate, type TranslateFn } from "@/lib/i18n/translate";

/** Fallback translator for callers without an i18n context — still fills placeholders. */
const defaultTranslate: TranslateFn = (text, vars) => interpolate(text, vars);

export type StockQuantityMode = "allocate" | "transfer";

export type StockQuantityFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxAvailable: number;
  mode: StockQuantityMode;
  disabled?: boolean;
  fieldClassName: string;
  /** Catalog total — allocate mode breakdown */
  catalogTotal?: number;
  /** Sum allocated across all warehouses */
  allocatedTotal?: number;
  /** Catalog minus total allocated (can still be placed in warehouses) */
  unallocatedRemaining?: number;
  /** REQ-0108 — edit mode reserved floor per warehouse row */
  minReserved?: number;
};

function parseQty(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function getStockQuantityValidation(
  raw: string,
  maxAvailable: number,
  mode: StockQuantityMode,
  minReserved = 0,
  t: TranslateFn = defaultTranslate,
): { valid: boolean; message: string | null } {
  const qty = parseQty(raw);
  if (qty === null) {
    return { valid: false, message: t("Enter a whole number.") };
  }
  if (qty < 0) {
    return { valid: false, message: t("Quantity cannot be negative.") };
  }
  if (mode === "allocate" && minReserved > 0 && qty < minReserved) {
    return {
      valid: false,
      message: t(
        "Quantity cannot be below {min} reserved unit(s) for this warehouse.",
        { min: minReserved },
      ),
    };
  }
  if (mode === "transfer" && qty < 1) {
    return { valid: false, message: t("Transfer at least 1 unit.") };
  }
  if (mode === "transfer" && qty > maxAvailable) {
    return {
      valid: false,
      message: t("Only {max} unit(s) available to transfer.", {
        max: maxAvailable,
      }),
    };
  }
  if (mode === "allocate" && maxAvailable >= 0 && qty > maxAvailable) {
    return {
      valid: false,
      message: t("Only {max} unit(s) available in product stock.", {
        max: maxAvailable,
      }),
    };
  }
  return { valid: true, message: null };
}

export function StockQuantityField({
  id,
  value,
  onChange,
  maxAvailable,
  mode,
  disabled,
  fieldClassName,
  catalogTotal,
  allocatedTotal,
  unallocatedRemaining,
  minReserved = 0,
}: StockQuantityFieldProps) {
  const t = useT();
  const validation = getStockQuantityValidation(
    value,
    maxAvailable,
    mode,
    minReserved,
    t,
  );
  const qty = parseQty(value);

  const hint =
    mode === "transfer"
      ? maxAvailable > 0
        ? t(
            "{max} available in this warehouse · up to {max} can transfer",
            { max: maxAvailable },
          )
        : t("Select a product with available stock")
      : minReserved > 0
        ? t("{min} reserved in this warehouse · minimum {min}", {
            min: minReserved,
          })
        : catalogTotal !== undefined && unallocatedRemaining !== undefined
          ? t(
              "{catalog} catalog total · {allocated} allocated · up to {remaining} can be added here",
              {
                catalog: catalogTotal,
                allocated: allocatedTotal ?? 0,
                remaining: unallocatedRemaining,
              },
            )
          : null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <Label htmlFor={id} className="text-sm text-white/80">
          {t("Quantity")} *
        </Label>
        {hint ? (
          <span className="text-xs text-white/80">{hint}</span>
        ) : null}
      </div>
      <Input
        id={id}
        type="number"
        min={mode === "transfer" ? 1 : minReserved > 0 ? minReserved : 0}
        max={maxAvailable > 0 ? maxAvailable : undefined}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={mode === "transfer" ? "1" : "0"}
        aria-invalid={!validation.valid && value.trim() !== ""}
        className={cn(
          "mt-1 h-11 w-full rounded-xl",
          fieldClassName,
          !validation.valid && value.trim() !== ""
            ? "border-rose-400/60 focus-visible:ring-rose-400/40"
            : null,
        )}
      />
      {!validation.valid && value.trim() !== "" ? (
        <p className={cn("mt-1", DIALOG_FORM_ERROR_TEXT)} role="alert">
          {validation.message}
        </p>
      ) : validation.valid && qty !== null && qty >= 0 && qty >= minReserved ? (
        <p className={cn("mt-1", DIALOG_FORM_SUCCESS_TEXT)}>
          {mode === "transfer"
            ? t("Transferring {qty} of {max} available unit(s).", {
                qty,
                max: maxAvailable,
              })
            : t("Allocating {qty} unit(s) to this warehouse.", { qty })}
        </p>
      ) : null}
    </div>
  );
}
