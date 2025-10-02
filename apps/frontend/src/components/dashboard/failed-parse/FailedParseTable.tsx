"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type Table,
  type Row,
  type Cell
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { BaseTable } from "../../tables/BaseTable";
import { ServerSidePagination } from "../../tables/ServerSidePagination";
import type { FailedParseMessage, CustomColumnMeta } from "@eggosystem/types";
import {
  useFailedParseMessages,
  useReparseMessages
} from "@/hooks/data/dashboard/useFailedParseMessages";
import { useMatchDetailsByGameId } from "@/hooks/data/useMatchDetailsByGameId";
import { toast } from "sonner";
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

interface FailedParseTableProps {
  initialQueueFilter?: string;
  initialStatusFilter?: string;
}

export const FailedParseTable = ({
  initialQueueFilter,
  initialStatusFilter = "failed"
}: FailedParseTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [queueFilter, setQueueFilter] = useState<string | undefined>(
    initialQueueFilter
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    initialStatusFilter
  );
  const [currentPage, setCurrentPage] = useState(0);

  const pageSize = 20;

  // Debug logging for status changes
  const handleStatusChange = useCallback(
    (value: string) => {
      console.log("Status filter changing to", value);
      try {
        const newStatus = value === "all" ? undefined : value;
        setStatusFilter(newStatus);
        setCurrentPage(0);
        console.log("Status filter set to:", newStatus);
      } catch (error) {
        console.error("Error changing status filter:", error);
        toast.error("Failed to change status filter");
      }
    },
    [] // Remove statusFilter from dependencies to prevent infinite loop
  );

  const { failedMessages, pagination, isLoading, error, mutate } =
    useFailedParseMessages({
      limit: pageSize,
      offset: currentPage * pageSize,
      queue_name: queueFilter,
      status: statusFilter
    });

  const { submitReparse, isSubmitting } = useReparseMessages();

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

  // TanStack Table configuration
  const table = useReactTable({
    data: failedMessages,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: (row) => row.original.status === "failed"
  });

  const customCellClassName = (
    cell: Cell<FailedParseMessage, unknown>,
    row: FailedParseMessage
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

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleReparse = useCallback(async () => {
    if (selectedCount === 0) {
      toast.error("No messages selected for reparse");
      return;
    }

    const messageIds = selectedRows.map((row) => row.original.id);

    try {
      const result = await submitReparse({
        message_ids: messageIds,
        priority: 5
      });

      if (result.success) {
        toast.success(
          `Successfully requeued ${result.requeued_count} message(s) for parsing`
        );

        // Clear selection and refresh data
        setRowSelection({});
        mutate();
      } else {
        toast.error(
          `Reparse failed: ${result.failed_count} message(s) could not be requeued`
        );
        if (result.errors && result.errors.length > 0) {
          console.error("Reparse errors:", result.errors);
        }
      }
    } catch (error) {
      toast.error("Failed to submit reparse request");
      console.error("Reparse error:", error);
    }
  }, [selectedCount, selectedRows, submitReparse, mutate]);

  const handleRefresh = useCallback(() => {
    mutate();
    setRowSelection({});
  }, [mutate]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Parse Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Loading failed messages...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Parse Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-4" />
            <div className="text-red-500 font-medium mb-2">
              Failed to load failed messages
            </div>
            <p className="text-muted-foreground text-sm">
              Please try refreshing the page or contact support if the problem
              persists.
            </p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!failedMessages || failedMessages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Parse Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              No failed messages found
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All parsing appears to be working correctly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Failed Parse Messages
              <Badge variant="secondary">{pagination?.total || 0} total</Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <>
                <Badge variant="secondary">{selectedCount} selected</Badge>
                <Button
                  onClick={handleReparse}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Requeuing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Requeue for Parse
                    </>
                  )}
                </Button>
              </>
            )}
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Queue:</label>
            <Select
              value={queueFilter || "all"}
              onValueChange={(value) => {
                setQueueFilter(value === "all" ? undefined : value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Queues</SelectItem>
                <SelectItem value="parse_queue_failed">Parse Queue</SelectItem>
                <SelectItem value="parsed_save_failed">Save Failed</SelectItem>
                <SelectItem value="work_queue_failed">Work Queue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="requeued">Requeued</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <BaseTable
          table={table}
          columns={columns}
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
                onPageChange={setCurrentPage}
              />
            ) : undefined
          }
        />
      </CardContent>
    </Card>
  );
};
