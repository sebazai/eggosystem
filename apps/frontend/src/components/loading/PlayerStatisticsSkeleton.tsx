"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface PlayerStatisticsSkeletonProps {
  className?: string;
}

/**
 * Skeleton component for PlayerStatisticsForTeam, matching the grid structure
 * with two columns (one per team) and player stat rows.
 */
export function PlayerStatisticsSkeleton({
  className
}: PlayerStatisticsSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 ${className || ""}`}
    >
      {/* Team 1 skeleton */}
      <div className="flex flex-col">
        {/* Team name bar */}
        <div className="flex items-center justify-between p-2 mb-[1px] bg-kanaliiga-light-brown/30">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-7 w-10 rounded" />
            <Skeleton className="h-7 w-10 rounded" />
          </div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[2fr_repeat(4,1fr)] md:grid-cols-[2fr_repeat(6,1fr)] lg:grid-cols-[2fr_repeat(8,1fr)] items-center text-muted-foreground p-2 bg-kanaliiga-light-brown/30">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-12 mx-auto" />
          ))}
        </div>

        {/* Player rows */}
        {Array.from({ length: 5 }).map((_, playerIndex) => (
          <div
            key={playerIndex}
            className="grid grid-cols-[2fr_repeat(4,1fr)] md:grid-cols-[2fr_repeat(6,1fr)] lg:grid-cols-[2fr_repeat(8,1fr)] p-2 border-b border-gray-800 items-center"
          >
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 8 }).map((_, statIndex) => (
              <Skeleton key={statIndex} className="h-4 w-8 mx-auto" />
            ))}
          </div>
        ))}
      </div>

      {/* Team 2 skeleton */}
      <div className="flex flex-col">
        {/* Team name bar */}
        <div className="flex items-center justify-between p-2 mb-[1px] bg-kanaliiga-light-brown/30">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-7 w-10 rounded" />
            <Skeleton className="h-7 w-10 rounded" />
          </div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[2fr_repeat(4,1fr)] md:grid-cols-[2fr_repeat(6,1fr)] lg:grid-cols-[2fr_repeat(8,1fr)] items-center text-muted-foreground p-2 bg-kanaliiga-light-brown/30">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-12 mx-auto" />
          ))}
        </div>

        {/* Player rows */}
        {Array.from({ length: 5 }).map((_, playerIndex) => (
          <div
            key={playerIndex}
            className="grid grid-cols-[2fr_repeat(4,1fr)] md:grid-cols-[2fr_repeat(6,1fr)] lg:grid-cols-[2fr_repeat(8,1fr)] p-2 border-b border-gray-800 items-center"
          >
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 8 }).map((_, statIndex) => (
              <Skeleton key={statIndex} className="h-4 w-8 mx-auto" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
