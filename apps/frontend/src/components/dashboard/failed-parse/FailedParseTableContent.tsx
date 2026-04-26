"use client";

import { useMemo } from "react";
import {
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type Table,
  type Row,
  type Cell,
  type OnChangeFn
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TanStackTableWrapper } from "../../tables/TanStackTableWrapper";
import { TablePagination } from "../../tables/TablePagination";
import type { FailedParseMessage, CustomColumnMeta } from "@eggosystem/types";
import Link from "next/link";

/** Links to match game page via /match-games/[id] which redirects to /matches/[match_id]/games/[id] */
const MatchGameIdLink = ({ matchGameId }: { matchGameId: string | number }) => (
  <Link
    href={`/match-games/${matchGameId}`}
    className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
  >
    {matchGameId}
  </Link>
);

interface FailedParseTableContentProps {
  failedMessages: FailedParseMessage[];
  pagination?: {
    total: number;
    has_more: boolean;
  };
  currentPage: number;
  pageSize: number;
  sorting: SortingState;
  rowSelection: RowSelectionState;
  onSortingChange: OnChangeFn<SortingState>;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const FailedParseTableContent = ({
  failedMessages,
  pagination,
  currentPage,
  pageSize,
  sorting,
  rowSelection,
  onSortingChange,
  onRowSelectionChange,
  onPageChange,
  onPageSizeChange
}: FailedParseTableContentProps) => {
  // TanStack Table column definitions
  const columns = useMemo<ColumnDef<FailedParseMessage>[]>(
    () => [
      // Checkbox column
      {
        id: "select",
        header: ({ table }: { table: Table<FailedParseMessage> }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: Row<FailedParseMessage> }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            disabled={row.original.status !== "failed"}
          />
        ),
        enableSorting: false,
        meta: {
          responsive: "table-cell",
          tooltip: "Select",
          sortable: false
        }
      },
      {
        accessorKey: "match_game_id",
        header: "GAME ID",
        cell: ({ getValue }) => {
          const matchGameId = getValue<string>();
          return <MatchGameIdLink matchGameId={matchGameId} />;
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Game ID",
          sortable: true
        }
      },
      {
        accessorKey: "queue_name",
        header: "QUEUE",
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-xs">
            {getValue<string>()}
          </Badge>
        ),
        meta: {
          responsive: "table-cell",
          tooltip: "Queue",
          sortable: true
        }
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ getValue }) => {
          const status = getValue<string>();
          const variant =
            status === "failed"
              ? "destructive"
              : status === "requeued"
                ? "secondary"
                : "default";
          return (
            <Badge variant={variant} className="text-xs capitalize">
              {status}
            </Badge>
          );
        },
        meta: {
          responsive: "table-cell",
          tooltip: "Status",
          sortable: true
        }
      },
      {
        accessorKey: "final_error",
        header: "ERROR",
        cell: ({ getValue }) => {
          const error = getValue<string>() ?? "";
          const truncatedError =
            error.length > 80 ? error.substring(0, 80) + "..." : error || "—";
          return (
            <span
              className="text-sm text-muted-foreground"
              title={error || undefined}
            >
              {truncatedError}
            </span>
          );
        },
        enableSorting: false,
        meta: {
          responsive: "table-cell",
          tooltip: "Error",
          sortable: false
        }
      },
      {
        accessorKey: "failed_at",
        header: "FAILED AT",
        cell: ({ getValue }) => {
          const raw = getValue<string>();
          if (!raw || raw.trim() === "") {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          const date = new Date(raw);
          const label = Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleString();
          return (
            <span className="text-sm text-muted-foreground" title={raw}>
              {label}
            </span>
          );
        },
        meta: {
          responsive: "hidden md:table-cell",
          tooltip: "Failed At",
          sortable: true
        }
      },
      {
        accessorKey: "source",
        header: "SOURCE",
        cell: ({ getValue }) => {
          const source = getValue<string>();
          return source ? (
            <Badge variant="outline" className="text-xs">
              {source}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          );
        },
        meta: {
          responsive: "hidden lg:table-cell",
          tooltip: "Source",
          sortable: true
        }
      }
    ],
    []
  );

  const customCellClassName = (
    cell: Cell<FailedParseMessage, unknown>,
    _row: FailedParseMessage
  ) => {
    return `px-4 py-3 text-sm text-left ${
      (cell.column.columnDef.meta as CustomColumnMeta)?.responsive || ""
    } ${cell.column.id === "select" ? "text-center" : ""}`;
  };

  const customRowClassName = (row: FailedParseMessage) => {
    return `hover:bg-muted/50 transition-colors ${
      row.status !== "failed" ? "opacity-60" : ""
    }`;
  };

  return (
    <TanStackTableWrapper
      data={failedMessages}
      columns={columns}
      getSortedRowModel={getSortedRowModel()}
      sorting={sorting}
      onSortingChange={onSortingChange}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      getRowId={(row) => row.id.toString()}
      enableRowSelection={(row) => row.original.status === "failed"}
      showPagination={true}
      customCellClassName={customCellClassName}
      customRowClassName={customRowClassName}
      customPagination={
        pagination ? (
          <TablePagination
            totalRows={pagination.total}
            currentPage={currentPage + 1}
            totalPages={Math.max(1, Math.ceil(pagination.total / pageSize))}
            handlePageChange={(page) => onPageChange(page - 1)}
            handlePageSizeChange={onPageSizeChange}
            pageSize={pageSize}
            type="items"
          />
        ) : undefined
      }
    />
  );
};
