"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface RowSkeletonProps {
  /**
   * Number of rows to render
   * @default 10
   */
  rows?: number;
  /**
   * Whether to show an avatar/image skeleton on the left
   * @default true
   */
  showAvatar?: boolean;
  /**
   * Whether to show a rank badge skeleton
   * @default false
   */
  showRank?: boolean;
  /**
   * Whether to show additional content on the right (e.g., badges, points)
   * @default true
   */
  showRightContent?: boolean;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * Skeleton component for list rows, matching the structure of HallOfFameRow
 * and similar row-based layouts.
 */
export function RowSkeleton({
  rows = 10,
  showAvatar = true,
  showRank = false,
  showRightContent = true,
  className
}: RowSkeletonProps) {
  return (
    <div className={className || ""}>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-3 sm:p-4">
            {/* Mobile layout: stacked */}
            <div className="block sm:hidden">
              <div className="flex items-center gap-2">
                {showRank && (
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                )}
                {showAvatar && (
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                {showRightContent && <Skeleton className="h-4 w-12 shrink-0" />}
              </div>
              <div className="mt-2 ml-9 flex gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>

            {/* Desktop layout: horizontal */}
            <div className="hidden sm:flex items-center gap-4">
              {showRank && (
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              )}
              {showAvatar && (
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
                {showRightContent && <Skeleton className="h-5 w-12 shrink-0" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
