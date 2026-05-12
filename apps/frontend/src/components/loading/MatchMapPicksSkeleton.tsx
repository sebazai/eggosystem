"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface MatchMapPicksSkeletonProps {
  className?: string;
}

/**
 * Skeleton component for MatchMapPicks, matching the structure of maps played
 * and map picks & bans sections.
 */
export function MatchMapPicksSkeleton({
  className
}: MatchMapPicksSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 ${className || ""}`}
    >
      {/* MAPS PLAYED section (left column) */}
      <div className="w-full">
        <Skeleton className="h-7 w-32 mb-3" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="relative flex flex-1 min-h-10 items-center overflow-hidden rounded my-1 border-1 border-kanaliiga-light-brown/50"
          >
            <Skeleton className="absolute inset-0" />
            <div className="absolute bottom-1 left-1 right-1 z-10">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-1 p-3 z-10 w-full justify-end">
              <Skeleton className="h-5 w-6" />
              <span className="text-md">-</span>
              <Skeleton className="h-5 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* MAP PICKS & BANS section (right column) */}
      <div className="w-full">
        <Skeleton className="h-7 w-40 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm shadow-lg p-4 min-h-[140px] flex flex-col items-center justify-center"
            >
              <Skeleton className="absolute inset-0" />
              <div className="relative z-10 text-center w-full">
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-6 w-16 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
