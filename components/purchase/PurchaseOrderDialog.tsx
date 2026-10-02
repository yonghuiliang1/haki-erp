"use client";

/**
 * Create-purchase-order dialog.
 * Controlled state on purpose: the line editor is a small dynamic list, so
 * plain state keeps it readable; the API validates the payload again server-side.
 */

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogDateField,
  DialogFormLabel,
  DialogHeaderBrand,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { formatStableCurrency } from "@/lib/format";
import { ClipboardList, Plus, Trash2, X } from "lucide-react";
import {
  useCreatePurchaseOrder,
  useProducts,
  useSuppliers,
  useWarehouses,
} from "@/hooks/queries";

type CurrencyCode = "USD" | "EUR" | "CNY";

type DraftLine = {
  key: string;
  productId: string;
  quantity: string;
  unitCost: string;
};

function blankLine(): DraftLine {
  return {
    key: `line-${Math.random().toString(36).slice(2, 10)}`,
    productId: "",
    quantity: "",
    unitCost: "",
  };
}

export type PurchaseOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PurchaseOrderDialog({
  open,
  onOpenChange,
}: PurchaseOrderDialogProps) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const createMutation = useCreatePurchaseOrder();

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [formError, setFormError] = useState<string | null>(null);

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const qty = Number(line.quantity) || 0;
        const cost = Number(line.unitCost) || 0;
        return sum + qty * cost;
      }, 0),
    [lines],
  );

  const resetForm = () => {
    setSupplierId("");
    setWarehouseId("");
    setCurrency("USD");
    setExpectedAt("");
    setNotes("");
    setLines([blankLine()]);
    setFormError(null);
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const handleSubmit = () => {
    if (!supplierId) {
      setFormError("Choose a supplier for this purchase order.");
      return;
    }
    const items = lines
      .filter((line) => line.productId)
      .map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.unitCost > 0,
      );

    if (items.length === 0) {
      setFormError(
        "Add at least one line with a product, quantity, and unit cost.",
      );
      return;
    }

    setFormError(null);
    createMutation.mutate(
      {
        supplierId,
        warehouseId: warehouseId || undefined,
        currency,
        expectedAt: expectedAt || undefined,
        notes: notes.trim() || undefined,
        items,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!createMutation.isPending) onOpenChange(next);
      }}
    >
      <DialogContent
        className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-cyan-400/30 shadow-[0_30px_80px_rgba(6,182,212,0.35)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeaderBrand
          icon={ClipboardList}
          tone="teal"
          title="New Purchase Order"
          description="Order stock from a supplier; inventory updates when the order is received."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Supplier */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">
              Supplier
            </label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                    DIALOG_FORM_FIELD_VIOLET,
                  )}
                  aria-hidden
                >
                  {suppliers.find((s) => s.id === supplierId)?.name ??
                    "Select Supplier"}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={supplierId}
                  onValueChange={setSupplierId}
                >
                  <SelectTrigger
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}
                  >
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id}
                        className={DIALOG_SELECT_ITEM_CLASS}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          </div>

          {/* Receiving warehouse (optional) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">
              Receiving Warehouse
            </label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                    DIALOG_FORM_FIELD_VIOLET,
                  )}
                  aria-hidden
                >
                  {warehouses.find((w) => w.id === warehouseId)?.name ??
                    "Optional"}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={warehouseId}
                  onValueChange={setWarehouseId}
                >
                  <SelectTrigger
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}
                  >
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {warehouses.map((warehouse) => (
                      <SelectItem
                        key={warehouse.id}
                        value={warehouse.id}
                        className={DIALOG_SELECT_ITEM_CLASS}
                      >
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">
              Currency
            </label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                    DIALOG_FORM_FIELD_VIOLET,
                  )}
                  aria-hidden
                >
                  {currency}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={currency}
                  onValueChange={(value) => setCurrency(value as CurrencyCode)}
                >
                  <SelectTrigger
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_VIOLET)}
                  >
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {(["USD", "EUR", "CNY"] as const).map((code) => (
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

          <DialogDateField
            id="purchase-expected-at"
            label="Expected Arrival"
            optional
            labelIcon={null}
            value={expectedAt}
            onChange={setExpectedAt}
            inputClassName={DIALOG_FORM_FIELD_VIOLET}
          />
        </div>

        {/* Lines */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <DialogFormLabel icon={ClipboardList}>
              Order Lines
            </DialogFormLabel>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLines((prev) => [...prev, blankLine()])}
              className="h-9 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-500/30 via-cyan-500/15 to-cyan-500/5 text-gray-700 dark:text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line
            </Button>
          </div>

          {lines.map((line) => (
            <div
              key={line.key}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_110px_130px_40px] gap-2 items-end p-2 rounded-xl border border-cyan-400/20 bg-white/5"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <label className="text-xs text-white/70">Product</label>
                <DeferredSelectGate
                  enabled={open}
                  placeholder={
                    <div
                      className={cn(
                        "flex h-10 w-full items-center rounded-md px-2 text-sm text-white/60",
                        DIALOG_FORM_FIELD_VIOLET,
                      )}
                      aria-hidden
                    >
                      {products.find((p) => p.id === line.productId)?.name ??
                        "Select Product"}
                    </div>
                  }
                >
                  {({ selectRemountKey }) => (
                    <Select
                      key={selectRemountKey}
                      value={line.productId}
                      onValueChange={(value) =>
                        updateLine(line.key, { productId: value })
                      }
                    >
                      <SelectTrigger
                        className={cn("h-10 w-full", DIALOG_FORM_FIELD_VIOLET)}
                      >
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent
                        className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                        position="popper"
                        sideOffset={5}
                        align="start"
                      >
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id}
                            className={DIALOG_SELECT_ITEM_CLASS}
                          >
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/70">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) =>
                    updateLine(line.key, { quantity: event.target.value })
                  }
                  placeholder="0"
                  className={cn("h-10", DIALOG_FORM_FIELD_VIOLET)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/70">Unit Cost</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitCost}
                  onChange={(event) =>
                    updateLine(line.key, { unitCost: event.target.value })
                  }
                  placeholder="0.00"
                  className={cn("h-10", DIALOG_FORM_FIELD_VIOLET)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={lines.length === 1}
                onClick={() =>
                  setLines((prev) =>
                    prev.filter((item) => item.key !== line.key),
                  )
                }
                className="h-10 w-10 p-0 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-500 dark:text-rose-300"
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex justify-between items-center p-3 rounded-xl border border-cyan-400/20 bg-white/5 text-sm text-white/80">
            <span>Order Total</span>
            <span className="font-medium text-white">
              {formatStableCurrency(total)}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 space-y-2">
          <DialogFormLabel htmlFor="purchase-notes" icon={ClipboardList} optional>
            Notes
          </DialogFormLabel>
          <Input
            id="purchase-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Payment terms, packing notes…"
            className={cn("h-11", DIALOG_FORM_FIELD_VIOLET)}
          />
        </div>

        {formError && (
          <p className="mt-3 text-sm text-red-400">{formError}</p>
        )}

        <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              className={cn("w-full sm:w-auto px-11 gap-2", GLASS_GHOST_BUTTON)}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Cancel
            </Button>
          </DialogClose>
          <DialogSubmitButton
            type="button"
            onClick={handleSubmit}
            isPending={createMutation.isPending}
            pendingLabel="Creating…"
            label="Create Purchase Order"
            icon={ClipboardList}
            hue="cyan"
            disabled={createMutation.isPending}
            className="px-11"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}