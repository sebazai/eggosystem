"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TeamStatisticsSkeletonProps {
  className?: string;
  showVideo?: boolean;
}

/**
 * Skeleton component for TeamStatistics, matching the structure of team stat boxes
 * with two side-by-side cards and optional video section.
 */
export function TeamStatisticsSkeleton({
  className,
  showVideo = false
}: TeamStatisticsSkeletonProps) {
  return (
    <div
      className={cn(
        "grid xl:flex grid-cols-1 sm:grid-cols-2 xl:flex-row gap-4 w-full",
        showVideo ? "gap-4" : "gap-4 md:gap-10",
        className
      )}
    >
      {/* Video skeleton (if applicable) */}
      {showVideo && (
        <div
          className={cn(
            "min-w-0 flex flex-col",
            "order-1 xl:order-2 col-span-1 sm:col-span-2 xl:col-auto w-full xl:flex-[3] xl:basis-3/5",
            "md:border-l md:border-r md:border-kanaliiga-orange"
          )}
        >
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="w-full h-full min-h-[200px] xs:min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px]" />
        </div>
      )}

      {/* Team 1 Stats */}
      <div
        className={cn(
          "min-w-0 flex flex-col",
          showVideo
            ? "order-2 xl:order-1 col-span-1 w-full xl:w-auto basis-1/5"
            : "flex-1"
        )}
      >
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {/* Round breakdown skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Team 2 Stats */}
      <div
        className={cn(
          "min-w-0 flex flex-col",
          showVideo
            ? "order-2 xl:order-3 col-span-1 w-full xl:w-auto basis-1/5"
            : "flex-1"
        )}
      >
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {/* Round breakdown skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
