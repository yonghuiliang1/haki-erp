"use client";

/**
 * REQ-0185 — Support ticket table Actions (MoreVertical).
 * View Details · Edit Ticket (dialog) · Delete (dynamic confirm).
 * Edit/Delete when session user is creator or assignee (API gate parity).
 * REQ-0190/0191 — Admin Reassign… via TicketReassignDialog.
 */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialogWrapper } from "@/components/dialogs";
import SupportTicketDialog from "@/components/support-tickets/SupportTicketDialog";
import TicketReassignDialog from "@/components/support-tickets/TicketReassignDialog";
import { useDeleteSupportTicket } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { logger } from "@/lib/logger";
import { useT } from "@/lib/i18n/locale-context";
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  UserRoundPen,
} from "lucide-react";
import type { ProductOwnerOption, SupportTicket } from "@/types";

function truncateTicketDescription(text: string, max = 80): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export type SupportTicketActionsProps = {
  ticket: SupportTicket;
  detailHrefBase?: string;
  productOwners?: ProductOwnerOption[];
  /** "sky" personal activity; "violet" admin store tickets */
  dialogVariant?: "sky" | "violet";
};

export default function SupportTicketActions({
  ticket,
  detailHrefBase = "/admin/support-tickets",
  productOwners = [],
  dialogVariant = "violet",
}: SupportTicketActionsProps) {
  const t = useT();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const deleteMutation = useDeleteSupportTicket();
  const isDeleting = deleteMutation.isPending;
  const detailHref = `${detailHrefBase}/${ticket.id}`;

  const sessionId = user?.id;
  const isAdmin = user?.role === "admin";
  const canMutate =
    !!sessionId &&
    (ticket.userId === sessionId || ticket.assignedToId === sessionId);
  // REQ-0190 — admin Reassign is separate from Edit Send-to lock
  const canReassign = isAdmin && productOwners.length > 0;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(ticket.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      logger.error("Error deleting support ticket:", error);
    }
  };

  const descPreview = truncateTicketDescription(ticket.description, 80);
  const deleteDescription = descPreview
    ? t(
        'This will permanently delete the ticket "{subject}": {preview}',
        { subject: ticket.subject, preview: descPreview },
      )
    : t(
        'This will permanently delete the ticket "{subject}". This action cannot be undone.',
        { subject: ticket.subject },
      );

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
          {canMutate ? (
            <DropdownMenuItem
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              {t("Edit Ticket")}
            </DropdownMenuItem>
          ) : null}
          {canReassign ? (
            <DropdownMenuItem
              onClick={() => setReassignOpen(true)}
              className="flex items-center gap-2"
            >
              <UserRoundPen className="h-4 w-4" />
              {t("Reassign…")}
            </DropdownMenuItem>
          ) : null}
          {canMutate ? (
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? t("Deleting...") : t("Delete Ticket")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canMutate ? (
        <SupportTicketDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          productOwners={productOwners}
          existingTicket={ticket}
          variant={dialogVariant}
        />
      ) : null}

      {canReassign ? (
        <TicketReassignDialog
          ticket={ticket}
          productOwners={productOwners}
          open={reassignOpen}
          onOpenChange={setReassignOpen}
          variant={dialogVariant}
        />
      ) : null}

      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("Delete support ticket?")}
        description={deleteDescription}
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
