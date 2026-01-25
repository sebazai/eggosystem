"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { TableSkeleton } from "@/components/loading";

export const FailedParseLoadingState = () => (
  <Card>
    <CardHeader>
      <CardTitle>Failed Parse Messages</CardTitle>
    </CardHeader>
    <CardContent>
      <TableSkeleton rows={10} columns={6} showHeader={false} />
    </CardContent>
  </Card>
);

interface FailedParseErrorStateProps {
  onRetry: () => void;
}

export const FailedParseErrorState = ({
  onRetry
}: FailedParseErrorStateProps) => (
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
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const FailedParseEmptyState = () => (
  <Card>
    <CardHeader>
      <CardTitle>Failed Parse Messages</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8">
        <div className="text-muted-foreground">No failed messages found</div>
        <p className="text-sm text-muted-foreground mt-2">
          All parsing appears to be working correctly.
        </p>
      </div>
    </CardContent>
  </Card>
);
