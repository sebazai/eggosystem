"use client";

import { useCallback } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FailedParseTableHeaderProps {
  totalCount: number;
  selectedCount: number;
  isSubmitting: boolean;
  isRequeueAllSubmitting?: boolean;
  onReparse: () => void;
  onRequeueAll?: () => void;
  onRefresh: () => void;
  requeueLabel?: string;
  requeueAllLabel?: string;
}

export const FailedParseTableHeader = ({
  totalCount,
  selectedCount,
  isSubmitting,
  isRequeueAllSubmitting = false,
  onReparse,
  onRequeueAll,
  onRefresh,
  requeueLabel = "Requeue for Parse",
  requeueAllLabel = "Requeue All"
}: FailedParseTableHeaderProps) => {
  const handleReparse = useCallback(() => {
    onReparse();
  }, [onReparse]);

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  const handleRequeueAll = useCallback(() => {
    onRequeueAll?.();
  }, [onRequeueAll]);

  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Failed Parse Messages
            <Badge variant="secondary">{totalCount} total</Badge>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {onRequeueAll && (
            <Button
              onClick={handleRequeueAll}
              disabled={isSubmitting || isRequeueAllSubmitting}
              size="sm"
              variant="outline"
            >
              {isRequeueAllSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Requeuing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {requeueAllLabel}
                </>
              )}
            </Button>
          )}
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
                    {requeueLabel}
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
    </CardHeader>
  );
};
