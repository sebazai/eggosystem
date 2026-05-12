"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 10,
  columns = 5,
  className,
  showHeader = true
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {showHeader && (
        <div
          className="bg-kanaliiga-light-brown/30 grid gap-4 mb-4 border-b pb-2 px-3 py-2"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              className="h-5 w-full bg-kanaliiga-orange/20 px-3"
            />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4 py-2 px-3"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-6 w-full px-3"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
