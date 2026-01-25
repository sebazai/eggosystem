"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface StatsGridSkeletonProps {
  sections?: number;
  rowsPerSection?: number;
}

export function StatsGridSkeleton({
  sections = 4,
  rowsPerSection = 5
}: StatsGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: sections }).map((_, index) => (
        <div key={index} className="bg-card rounded-sm overflow-hidden">
          <div className="bg-kanaliiga-light-brown/30 p-4">
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="p-4">
            {Array.from({ length: rowsPerSection }).map((_, playerIndex) => (
              <div
                key={playerIndex}
                className="flex items-center justify-between py-3 px-2"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-6 w-6" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
