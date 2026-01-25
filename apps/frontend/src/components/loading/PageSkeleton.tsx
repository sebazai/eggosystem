"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  className?: string;
  showFilters?: boolean;
  showTitle?: boolean;
}

export function PageSkeleton({
  className,
  showFilters = false,
  showTitle = false
}: PageSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {showTitle && <Skeleton className="h-9 w-48 mb-4 md:mb-8" />}
      {showFilters && (
        <div className="pb-2 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full md:hidden" />
        </div>
      )}
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full hidden md:block" />
      </div>
    </div>
  );
}
