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
  onReparse: () => void;
  onRefresh: () => void;
}

export const FailedParseTableHeader = ({
  totalCount,
  selectedCount,
  isSubmitting,
  onReparse,
  onRefresh
}: FailedParseTableHeaderProps) => {
  const handleReparse = useCallback(() => {
    onReparse();
  }, [onReparse]);

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

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
    </CardHeader>
  );
};
