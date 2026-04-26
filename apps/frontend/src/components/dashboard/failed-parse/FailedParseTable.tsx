"use client";

import { useMemo, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type {
  SortingState,
  RowSelectionState,
  OnChangeFn
} from "@tanstack/react-table";
import {
  useFailedParseMessages,
  useReparseMessages,
  useRequeue2ddataMessages,
  useRequeueAllFailedMessages
} from "@/hooks/data/dashboard/useFailedParseMessages";
import { toast } from "sonner";
import { FailedParseFilters } from "./FailedParseFilters";
import { FailedParseTableHeader } from "./FailedParseTableHeader";
import { FailedParseTableContent } from "./FailedParseTableContent";
import {
  FailedParseLoadingState,
  FailedParseErrorState,
  FailedParseEmptyState
} from "./FailedParseStates";

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
  const [pageSize, setPageSize] = useState(20);

  // Memoize the hook parameters to prevent unnecessary re-renders
  const hookParams = useMemo(
    () => ({
      limit: pageSize,
      offset: currentPage * pageSize,
      queue_name: queueFilter,
      status: statusFilter
    }),
    [pageSize, currentPage, queueFilter, statusFilter]
  );

  const { failedMessages, pagination, isLoading, error, mutate } =
    useFailedParseMessages(hookParams);

  const filteredMessages = useMemo(() => {
    if (!statusFilter || statusFilter === "all") {
      return failedMessages;
    }
    return failedMessages.filter((message) => message.status === statusFilter);
  }, [failedMessages, statusFilter]);

  const { submitReparse, isSubmitting } = useReparseMessages();
  const { submitRequeue2ddata, isSubmitting: isSubmitting2d } =
    useRequeue2ddataMessages();
  const { submitRequeueAll, isSubmitting: isSubmittingAll } =
    useRequeueAllFailedMessages();
  const isSubmittingAny = isSubmitting || isSubmitting2d;
  const is2ddataQueue = queueFilter === "parse_2ddata_failed";
  const isSubmittingHeader = isSubmittingAny || isSubmittingAll;

  // TanStack Table callback handlers
  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        setSorting(updaterOrValue);
      } else {
        setSorting(updaterOrValue);
      }
    },
    []
  );

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = useCallback(
    (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        setRowSelection(updaterOrValue);
      } else {
        setRowSelection(updaterOrValue);
      }
    },
    []
  );

  // Filter change handlers
  const handleQueueChange = useCallback((value: string) => {
    setQueueFilter(value === "" ? undefined : value);
    setCurrentPage(0);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value === "" ? undefined : value);
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0);
    setRowSelection({});
  }, []);

  // Reparse handler: send match_game_ids so backend only acks/requeues those messages
  const handleReparse = useCallback(async () => {
    const selectedKeys = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    if (selectedKeys.length === 0) {
      toast.error("No messages selected for reparse");
      return;
    }

    if (queueFilter === "parse_2ddata_failed") {
      const items = selectedKeys
        .map((key) => filteredMessages.find((m) => m.id.toString() === key))
        .filter((m) => m != null)
        .map((m) => {
          const demoPath = String(
            (m.original_message as Record<string, unknown>)?.demo_path ?? ""
          );
          return { match_game_id: m.match_game_id, demo_path: demoPath };
        })
        .filter((i) => i.match_game_id !== "" && i.demo_path !== "");

      if (items.length === 0) {
        toast.error(
          "Could not resolve (match_game_id, demo_path) for selection"
        );
        return;
      }

      const uniqueItems = Array.from(
        new Map(
          items.map((i) => [`${i.match_game_id}::${i.demo_path}`, i])
        ).values()
      );

      try {
        const result = await submitRequeue2ddata({ items: uniqueItems });
        if (result.success) {
          toast.success(
            `Successfully requeued ${result.requeued_count} message(s) for 2D parsing`
          );
          setRowSelection({});
          mutate();
        } else {
          toast.error(
            `Requeue failed: ${result.failed_count} message(s) could not be requeued`
          );
          if (result.errors && result.errors.length > 0) {
            console.error("2ddata requeue errors:", result.errors);
          }
        }
      } catch (error) {
        toast.error("Failed to submit 2D requeue request");
        console.error("2ddata requeue error:", error);
      }
      return;
    }

    const matchGameIds = selectedKeys
      .map(
        (key) =>
          filteredMessages.find((m) => m.id.toString() === key)?.match_game_id
      )
      .filter((id): id is string => id != null && id !== "")
      .map((id) => parseInt(id, 10))
      .filter((n) => !Number.isNaN(n));

    if (matchGameIds.length === 0) {
      toast.error("Could not resolve match game IDs for selected rows");
      return;
    }

    try {
      const result = await submitReparse({
        match_game_ids: matchGameIds,
        priority: 5
      });

      if (result.success) {
        toast.success(
          `Successfully requeued ${result.requeued_count} message(s) for parsing`
        );
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
  }, [
    rowSelection,
    filteredMessages,
    submitReparse,
    submitRequeue2ddata,
    mutate,
    queueFilter
  ]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    mutate();
    setRowSelection({});
  }, [mutate]);

  const handleRequeueAll = useCallback(async () => {
    if (!queueFilter) {
      toast.error("Select a queue before requeueing all");
      return;
    }
    try {
      const result = await submitRequeueAll({
        queue_name: queueFilter,
        priority: 5
      });
      if (result.success) {
        toast.success(
          `Successfully requeued ${result.requeued_count} message(s)`
        );
        setRowSelection({});
        mutate();
      } else {
        toast.error(
          `Requeue all failed: ${result.failed_count} message(s) could not be requeued`
        );
        if (result.errors && result.errors.length > 0) {
          console.error("Requeue all errors:", result.errors);
        }
      }
    } catch (error) {
      toast.error("Failed to submit requeue all request");
      console.error("Requeue all error:", error);
    }
  }, [queueFilter, submitRequeueAll, mutate]);

  // Loading state
  if (isLoading) {
    return <FailedParseLoadingState />;
  }

  // Error state
  if (error) {
    return <FailedParseErrorState onRetry={handleRefresh} />;
  }

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <Card>
      <FailedParseTableHeader
        totalCount={pagination?.total || 0}
        selectedCount={selectedCount}
        isSubmitting={isSubmittingHeader}
        isRequeueAllSubmitting={isSubmittingAll}
        onReparse={handleReparse}
        onRequeueAll={queueFilter ? handleRequeueAll : undefined}
        onRefresh={handleRefresh}
        requeueLabel={
          is2ddataQueue ? "Requeue for 2D Parse" : "Requeue for Parse"
        }
        requeueAllLabel={is2ddataQueue ? "Requeue All (2D)" : "Requeue All"}
      />

      <FailedParseFilters
        queueFilter={queueFilter}
        statusFilter={statusFilter}
        onQueueChange={handleQueueChange}
        onStatusChange={handleStatusChange}
      />

      <CardContent>
        {!filteredMessages || filteredMessages.length === 0 ? (
          <FailedParseEmptyState />
        ) : (
          <FailedParseTableContent
            failedMessages={filteredMessages}
            pagination={pagination}
            currentPage={currentPage}
            pageSize={pageSize}
            sorting={sorting}
            rowSelection={rowSelection}
            onSortingChange={handleSortingChange}
            onRowSelectionChange={handleRowSelectionChange}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </CardContent>
    </Card>
  );
};
