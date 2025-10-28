"use client";

import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface FailedParseFiltersProps {
  queueFilter?: string;
  statusFilter?: string;
  onQueueChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export const FailedParseFilters = ({
  queueFilter,
  statusFilter,
  onQueueChange,
  onStatusChange
}: FailedParseFiltersProps) => {
  const handleQueueChange = useCallback(
    (value: string) => {
      onQueueChange(value === "all" ? "" : value);
    },
    [onQueueChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onStatusChange(value === "all" ? "" : value);
    },
    [onStatusChange]
  );

  return (
    <div className="px-6 pb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Queue:</label>
          <Select
            value={queueFilter || "all"}
            onValueChange={handleQueueChange}
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
    </div>
  );
};
