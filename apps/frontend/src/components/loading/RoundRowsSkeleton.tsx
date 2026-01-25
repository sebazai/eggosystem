"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface RoundRowsSkeletonProps {
  /**
   * Number of rounds to display
   * @default 16
   */
  rounds?: number;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * Skeleton component for RoundRows, matching the structure of round history display
 * with team logos on the left and round icons in columns.
 */
export function RoundRowsSkeleton({
  rounds = 16,
  className
}: RoundRowsSkeletonProps) {
  return (
    <div className={className || ""}>
      <div className="flex gap-1">
        {/* Team logos on the left */}
        <div className="border-r-1 pr-4">
          <Skeleton className="min-w-8 min-h-8 max-w-8 max-h-8 mb-4 rounded" />
          <Skeleton className="min-w-8 min-h-8 max-w-8 max-h-8 mb-4 rounded" />
        </div>

        {/* Round columns */}
        {Array.from({ length: rounds }).map((_, index) => (
          <div key={index} className="mb-4">
            {/* Top team round icon */}
            <div className="mb-4 relative">
              <Skeleton className="w-8 h-8 rounded" />
              {/* Round number skeleton below icon */}
              <Skeleton className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-3 w-4" />
            </div>
            {/* Bottom team round icon */}
            <div className="mb-4 relative">
              <Skeleton className="w-8 h-8 rounded" />
              {/* Round number skeleton below icon */}
              <Skeleton className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-3 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
