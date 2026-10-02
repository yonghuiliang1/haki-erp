"use client";

/**
 * REQ-0186 — Actions menu includes View Details (Eye + Link) like Category/Supplier/Product.
 * `detailBase` supports admin embed (`/admin/warehouses/:id`) vs store (`/warehouses/:id`).
 */

import { useState } from "react";
import Link from "next/link";
import { Warehouse } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteWarehouse } from "@/hooks/queries";
import { AlertDialogWrapper } from "@/components/dialogs";
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface WarehouseActionsProps {
  row: { original: Warehouse };
  onEdit: (warehouse: Warehouse) => void;
  /** "" for store routes; "/admin" for admin embed detail links */
  detailBase?: string;
}

export default function WarehouseActions({
  row,
  onEdit,
  detailBase = "",
}: WarehouseActionsProps) {
  const t = useT();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteWarehouseMutation = useDeleteWarehouse();
  const isDeleting = deleteWarehouseMutation.isPending;

  const detailHref = detailBase
    ? `${detailBase}/warehouses/${row.original.id}`
    : `/warehouses/${row.original.id}`;

  const handleEdit = () => {
    onEdit(row.original);
  };

  const handleDelete = async () => {
    try {
      await deleteWarehouseMutation.mutateAsync(row.original.id);
      setDeleteDialogOpen(false);
    } catch {
      // Error toast is handled by mutation hook
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t("Open menu")}</span>
            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-md shadow-lg"
        >
          <DropdownMenuItem asChild>
            <Link href={detailHref} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("View Details")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t("Edit Warehouse")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? t("Deleting...") : t("Delete Warehouse")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("Are you absolutely sure?")}
        description={t("This will permanently delete the warehouse \"{name}\".", { name: row.original.name })}
        actionLabel={t("Delete")}
        actionLoadingLabel={t("Deleting...")}
        isLoading={isDeleting}
        onAction={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        actionVariant="destructive"
      />
    </>
  );
}
