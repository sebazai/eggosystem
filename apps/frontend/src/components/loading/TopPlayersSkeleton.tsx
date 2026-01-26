"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TopPlayersSkeletonProps {
  className?: string;
}

/**
 * Skeleton component for TopPlayers, matching the structure of the top players grid.
 */
export function TopPlayersSkeleton({ className }: TopPlayersSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 ${className || ""}`}
    >
      <div className="bg-card rounded-sm">
        <Skeleton className="h-7 w-32 mt-4 mb-2 md:mt-6 md:mb-4 mx-4" />
        <div className="grid grid-cols-[1.5fr_1fr_auto] gap-4 p-4">
          {/* Header row */}
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-12" />

          {/* Award rows */}
          {Array.from({ length: 8 }).map((_, index) => (
            <React.Fragment key={index}>
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-sm">
        {/* Empty second column matching TopPlayers structure */}
      </div>
    </div>
  );
}
