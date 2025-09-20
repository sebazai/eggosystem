"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
  type Table,
  type Row
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
import { ChevronUp, ChevronDown, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FailedParseMessage } from "@eggosystem/types";
import {
  useFailedParseMessages,
  useReparseMessages
} from "@/hooks/data/dashboard/useFailedParseMessages";
import { toast } from "sonner";

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

  const columnHelper = createColumnHelper<FailedParseMessage>();

  const columns = useMemo(
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
        meta: { className: "w-12 text-center" }
      },
      columnHelper.accessor("game_id", {
        header: "Game ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue()}</span>
        ),
        meta: { className: "text-left" }
      }),
      columnHelper.accessor("queue_name", {
        header: "Queue",
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-xs">
            {getValue()}
          </Badge>
        ),
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
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
        meta: { className: "text-center" }
      }),
      columnHelper.accessor("final_error", {
        header: "Error",
        cell: ({ getValue }) => {
          const error = getValue();
          const truncatedError =
            error.length > 80 ? error.substring(0, 80) + "..." : error;
          return (
            <span className="text-sm text-muted-foreground" title={error}>
              {truncatedError}
            </span>
          );
        },
        enableSorting: false,
        meta: { className: "text-left max-w-md" }
      }),
      columnHelper.accessor("failed_at", {
        header: "Failed At",
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleString()}
            </span>
          );
        },
        meta: { className: "text-left hidden md:table-cell min-w-[140px]" }
      }),
      columnHelper.accessor("source", {
        header: "Source",
        cell: ({ getValue }) => {
          const source = getValue();
          return source ? (
            <Badge variant="outline" className="text-xs">
              {source}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          );
        },
        meta: { className: "text-center hidden lg:table-cell" }
      })
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: failedMessages,
    columns,
    state: {
      sorting,
      rowSelection
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id.toString(),
    enableRowSelection: (row) => row.original.status === "failed"
  });

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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as
                      | { className?: string }
                      | undefined;

                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                          meta?.className
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              header.column.getCanSort()
                                ? "cursor-pointer select-none flex items-center gap-2 hover:text-foreground"
                                : ""
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <div className="flex flex-col">
                                <ChevronUp
                                  className={cn(
                                    "h-3 w-3 -mb-1",
                                    header.column.getIsSorted() === "asc"
                                      ? "text-foreground"
                                      : "text-muted-foreground/50"
                                  )}
                                />
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3",
                                    header.column.getIsSorted() === "desc"
                                      ? "text-foreground"
                                      : "text-muted-foreground/50"
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    row.original.status !== "failed" && "opacity-60"
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { className?: string }
                      | undefined;

                    return (
                      <td
                        key={cell.id}
                        className={cn("px-4 py-3 text-sm", meta?.className)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > pageSize && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Showing {currentPage * pageSize + 1} to{" "}
              {Math.min((currentPage + 1) * pageSize, pagination.total)} of{" "}
              {pagination.total} messages
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.has_more}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
