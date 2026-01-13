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
import { ServerSidePagination } from "../../tables/ServerSidePagination";
import type { FailedParseMessage, CustomColumnMeta } from "@eggosystem/types";
import { useMatchDetailsByGameId } from "@/hooks/data/useMatchDetailsByGameId";
import Link from "next/link";

interface MatchGameIdLinkProps {
  matchGameId: number;
}

const MatchGameIdLink = ({ matchGameId }: MatchGameIdLinkProps) => {
  const {
    data: matchDetails,
    isLoading,
    error
  } = useMatchDetailsByGameId(matchGameId);

  if (isLoading) {
    return (
      <span className="font-mono text-sm text-muted-foreground">
        Loading...
      </span>
    );
  }

  if (error || !matchDetails) {
    return <span className="font-mono text-sm">{matchGameId}</span>;
  }

  return (
    <Link
      href={`/matches/${matchDetails.match_id}/games/${matchGameId}`}
      className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      {matchGameId}
    </Link>
  );
};

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
  onPageChange
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
          const matchGameId = getValue<number>();
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
          const error = getValue<string>();
          const truncatedError =
            error.length > 80 ? error.substring(0, 80) + "..." : error;
          return (
            <span className="text-sm text-muted-foreground" title={error}>
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
          const date = new Date(getValue<string>());
          return (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleString()}
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
      showPagination={false}
      customCellClassName={customCellClassName}
      customRowClassName={customRowClassName}
      customPagination={
        pagination ? (
          <ServerSidePagination
            currentPage={currentPage}
            pageSize={pageSize}
            total={pagination.total}
            hasMore={pagination.has_more}
            onPageChange={onPageChange}
          />
        ) : undefined
      }
    />
  );
};
