"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
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
import { useFailedParseJobEvents } from "@/hooks/useFailedParseJobEvents";
import type {
  FailedParseJobEvent,
  FailedParseJobKind
} from "@eggosystem/types";
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

  const [pendingRowKeys, setPendingRowKeys] = useState(() => new Set<string>());
  const [spinAllFailedRows, setSpinAllFailedRows] = useState(false);
  const [requeuedRowKeys, setRequeuedRowKeys] = useState(
    () => new Set<string>()
  );
  const [isFinalSyncing, setIsFinalSyncing] = useState(false);
  const activeJobsRef = useRef<
    Map<string, { keys: string[]; kind: FailedParseJobKind }>
  >(new Map());
  const matchGameIdToRowKeysRef = useRef<Map<string, string[]>>(new Map());

  // Reconcile optimistic "requeued" labels with real server state on refresh.
  // We do this as derived render state (not setState in an effect) to avoid
  // cascading render warnings from our lint rules.
  const effectiveRequeuedRowKeys = useMemo(() => {
    if (requeuedRowKeys.size === 0) return requeuedRowKeys;

    const serverRequeued = new Set<string>();
    for (const m of filteredMessages) {
      if (m.status === "requeued") {
        serverRequeued.add(String(m.id));
      }
    }

    const next = new Set<string>();
    for (const k of requeuedRowKeys) {
      if (serverRequeued.has(k) || pendingRowKeys.has(k) || spinAllFailedRows) {
        next.add(k);
      }
    }
    return next;
  }, [requeuedRowKeys, filteredMessages, pendingRowKeys, spinAllFailedRows]);

  useEffect(() => {
    const next = new Map<string, string[]>();
    for (const m of filteredMessages) {
      const mgid = String(m.match_game_id);
      const rowKey = String(m.id);
      const list = next.get(mgid);
      if (list) {
        list.push(rowKey);
      } else {
        next.set(mgid, [rowKey]);
      }
    }
    matchGameIdToRowKeysRef.current = next;
  }, [filteredMessages]);

  const addPendingKeys = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setPendingRowKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
  }, []);

  const removePendingKeys = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setPendingRowKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    });
  }, []);

  const addRequeuedKeys = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setRequeuedRowKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
  }, []);

  const handleJobEvent = useCallback(
    (ev: FailedParseJobEvent) => {
      if (ev.status === "progress") {
        const matchGameIds = (ev.requeued_match_game_ids ?? []).map(String);
        const rowKeys: string[] = [];
        for (const mgid of matchGameIds) {
          const list = matchGameIdToRowKeysRef.current.get(mgid);
          if (!list || list.length === 0) continue;
          // Many rows can share the same match_game_id. Mark one unmarked row per progress tick.
          const nextRow =
            list.find((rk) => !requeuedRowKeys.has(rk)) ?? list[0];
          if (nextRow) rowKeys.push(nextRow);
        }
        if (rowKeys.length > 0) {
          addRequeuedKeys(rowKeys);
          removePendingKeys(rowKeys);
        }
        return;
      }
      if (ev.status !== "completed" && ev.status !== "failed") {
        return;
      }
      const meta = activeJobsRef.current.get(ev.job_id);
      if (!meta) {
        return;
      }
      activeJobsRef.current.delete(ev.job_id);

      if (meta.kind === "requeueAll") {
        setSpinAllFailedRows(false);
      } else {
        removePendingKeys(meta.keys);
      }
      // When the job completes, do a full refresh with a blocking UI overlay so
      // the table doesn't appear to "flip back" mid-transition.
      void (async () => {
        setIsFinalSyncing(true);
        try {
          await mutate();
        } finally {
          setRequeuedRowKeys(new Set());
          setPendingRowKeys(new Set());
          setIsFinalSyncing(false);
        }
      })();

      const requeued = ev.requeued_count ?? 0;
      const failed = ev.failed_count ?? 0;
      if (ev.status === "completed" && failed === 0) {
        toast.success(`Finished: ${requeued} message(s) requeued`);
      } else {
        toast.warning(
          `Finished with issues: ${requeued} requeued, ${failed} failed`
        );
      }
    },
    [mutate, removePendingKeys, addRequeuedKeys, requeuedRowKeys]
  );

  useFailedParseJobEvents(handleJobEvent);

  const hasBackgroundPending = spinAllFailedRows || pendingRowKeys.size > 0;
  const isSubmittingHeader =
    isSubmittingAny || isSubmittingAll || hasBackgroundPending;

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
        .filter((m): m is NonNullable<typeof m> => m != null)
        .map((m) => {
          const demoPath = String(m.original_message?.demo_path ?? "");
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

      addPendingKeys(selectedKeys);
      try {
        const result = await submitRequeue2ddata({ items: uniqueItems });
        if (result.success) {
          const requestedCount = result.requested_count ?? uniqueItems.length;
          if (result.queued && result.job_id) {
            activeJobsRef.current.set(result.job_id, {
              keys: [...selectedKeys],
              kind: "requeue2ddata"
            });
            toast.success(
              `Queued ${requestedCount} message(s) for 2D requeue in background`
            );
            setRowSelection({});
          } else if (result.queued) {
            removePendingKeys(selectedKeys);
            toast.success(
              `Queued ${requestedCount} message(s) for 2D requeue in background`
            );
            setRowSelection({});
            void mutate();
          } else {
            removePendingKeys(selectedKeys);
            toast.success(
              `Successfully requeued ${result.requeued_count} message(s) for 2D parsing`
            );
            setRowSelection({});
            void mutate();
          }
        } else {
          removePendingKeys(selectedKeys);
          toast.error(
            `Requeue failed: ${result.failed_count} message(s) could not be requeued`
          );
          if (result.errors && result.errors.length > 0) {
            console.error("2ddata requeue errors:", result.errors);
          }
        }
      } catch (error) {
        removePendingKeys(selectedKeys);
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

    addPendingKeys(selectedKeys);
    try {
      const result = await submitReparse({
        match_game_ids: matchGameIds,
        priority: 5
      });

      if (result.success) {
        const requestedCount = result.requested_count ?? matchGameIds.length;
        if (result.queued && result.job_id) {
          activeJobsRef.current.set(result.job_id, {
            keys: [...selectedKeys],
            kind: "reparse"
          });
          toast.success(
            `Queued ${requestedCount} message(s) for reparse in background`
          );
          setRowSelection({});
        } else if (result.queued) {
          removePendingKeys(selectedKeys);
          toast.success(
            `Queued ${requestedCount} message(s) for reparse in background`
          );
          setRowSelection({});
          void mutate();
        } else {
          removePendingKeys(selectedKeys);
          toast.success(
            `Successfully requeued ${result.requeued_count} message(s) for parsing`
          );
          setRowSelection({});
          void mutate();
        }
      } else {
        removePendingKeys(selectedKeys);
        toast.error(
          `Reparse failed: ${result.failed_count} message(s) could not be requeued`
        );
        if (result.errors && result.errors.length > 0) {
          console.error("Reparse errors:", result.errors);
        }
      }
    } catch (error) {
      removePendingKeys(selectedKeys);
      toast.error("Failed to submit reparse request");
      console.error("Reparse error:", error);
    }
  }, [
    rowSelection,
    filteredMessages,
    submitReparse,
    submitRequeue2ddata,
    mutate,
    queueFilter,
    addPendingKeys,
    removePendingKeys
  ]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsFinalSyncing(true);
    try {
      await mutate();
      setRequeuedRowKeys(new Set());
      setPendingRowKeys(new Set());
    } finally {
      setIsFinalSyncing(false);
      setRowSelection({});
    }
  }, [mutate]);

  const handleRequeueAll = useCallback(async () => {
    if (!queueFilter) {
      toast.error("Select a queue before requeueing all");
      return;
    }
    setSpinAllFailedRows(true);
    try {
      const result = await submitRequeueAll({
        queue_name: queueFilter,
        priority: 5
      });
      if (result.success) {
        if (result.queued && result.job_id) {
          activeJobsRef.current.set(result.job_id, {
            keys: [],
            kind: "requeueAll"
          });
          toast.success("Queued requeue-all in background");
        } else {
          setSpinAllFailedRows(false);
          toast.success(
            `Successfully requeued ${result.requeued_count} message(s)`
          );
          void mutate();
        }
        setRowSelection({});
      } else {
        setSpinAllFailedRows(false);
        toast.error(
          `Requeue all failed: ${result.failed_count} message(s) could not be requeued`
        );
        if (result.errors && result.errors.length > 0) {
          console.error("Requeue all errors:", result.errors);
        }
      }
    } catch (error) {
      setSpinAllFailedRows(false);
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
    <Card className="relative">
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

      <CardContent className="relative">
        {isFinalSyncing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              Syncing…
            </div>
          </div>
        )}
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
            pendingRowKeys={pendingRowKeys}
            spinAllFailedRows={spinAllFailedRows}
            requeuedRowKeys={effectiveRequeuedRowKeys}
          />
        )}
      </CardContent>
    </Card>
  );
};
