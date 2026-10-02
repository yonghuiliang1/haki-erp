/**
 * History (Import History) Table Columns
 * Column definitions for the import history table
 */

"use client";

import React from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import {
  ImportStatusBadge,
  ImportTypeBadge,
  formatSemanticLabel,
} from "@/lib/ui/semantic-badges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Eye } from "lucide-react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import Link from "next/link";
import { ClientDateTime } from "@/components/shared";
import { useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import type { ImportHistoryForPage } from "@/types";

type SortableHeaderProps = {
  column: Column<ImportHistoryForPage, unknown>;
  label: string;
};

/** Inline text rendered as a client component so non-component code can translate. */
function TranslatedText({ text }: { text: string }) {
  const t = useT();
  return <>{t(text)}</>;
}

function SortableHeader({ column, label }: SortableHeaderProps) {
  const t = useT();
  const isSorted = column.getIsSorted();
  const SortingIcon =
    isSorted === "asc"
      ? IoMdArrowUp
      : isSorted === "desc"
        ? IoMdArrowDown
        : ArrowUpDown;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="" asChild>
        <div
          className={cn(
            "flex items-center select-none cursor-pointer gap-1 py-2 text-sm font-normal text-gray-700 dark:text-white",
            isSorted && "text-primary",
          )}
          aria-label={t("Sort by {label}", { label: t(label) })}
        >
          {t(label)}
          <SortingIcon className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <IoMdArrowUp className="mr-2 h-4 w-4" />
          {t("Asc")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <IoMdArrowDown className="mr-2 h-4 w-4" />
          {t("Desc")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createHistoryColumns(
  detailHrefBase?: string,
): ColumnDef<ImportHistoryForPage>[] {
  return [
    {
      accessorKey: "importType",
      header: ({ column }) => (
        <SortableHeader column={column} label="Import Type" />
      ),
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return <ImportTypeBadge status={v} label={formatSemanticLabel(v)} />;
      },
    },
    {
      accessorKey: "fileName",
      header: ({ column }) => (
        <SortableHeader column={column} label="File Name" />
      ),
      cell: ({ getValue }) => (
        <span
          className="font-mono truncate max-w-[180px] block"
          title={getValue<string>()}
        >
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} label="Date" />,
      cell: ({ getValue }) => (
        <ClientDateTime date={getValue<string>()} semantic="created" />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <ImportStatusBadge status={status} />
        );
      },
    },
    {
      accessorKey: "totalRows",
      header: ({ column }) => (
        <SortableHeader column={column} label="Total Rows" />
      ),
      cell: ({ getValue }) => (
        <span>{getValue<number>()}</span>
      ),
    },
    {
      id: "successRows",
      header: () => <TranslatedText text="Success" />,
      cell: ({ row }) => (
        <span className="text-green-600 dark:text-green-400">
          {row.original.successRows}
        </span>
      ),
    },
    {
      id: "failedRows",
      header: () => <TranslatedText text="Failed" />,
      cell: ({ row }) => (
        <span className="text-red-600 dark:text-red-400">
          {row.original.failedRows}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <TranslatedText text="Actions" />,
      cell: ({ row }) => {
        const record = row.original;
        const href = detailHrefBase
          ? `${detailHrefBase}/${record.id}`
          : `/admin/activity-history/${record.id}`;
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href} className="gap-2">
              <Eye className="h-4 w-4" />
              <TranslatedText text="View" />
            </Link>
          </Button>
        );
      },
    },
  ];
}
