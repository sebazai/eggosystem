"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface MatchListSkeletonProps {
  items?: number;
  className?: string;
  showDateHeaders?: boolean;
}

export function MatchListSkeleton({
  items = 10,
  className,
  showDateHeaders = true
}: MatchListSkeletonProps) {
  // Group items by date headers (3-4 matches per date)
  const matchesPerDate = 3;
  const dateGroups = Math.ceil(items / matchesPerDate);

  return (
    <div className={className || ""}>
      {Array.from({ length: dateGroups }).map((_, dateIndex) => (
        <div key={dateIndex}>
          {showDateHeaders && (
            <h2 className="text-left text-sm sm:text-lg mb-2">
              <Skeleton className="h-5 w-32 inline-block" />
            </h2>
          )}
          {Array.from({ length: matchesPerDate }).map((_, matchIndex) => (
            <div key={matchIndex} className="mb-2 sm:mb-4">
              <div className="bg-card grid grid-cols-[1fr_auto_1fr] min-h-10 md:min-h-12 items-center gap-2 px-0 transition-transform transform mb-1 rounded-lg shadow-md dark:shadow-muted">
                <div className="flex items-center justify-end">
                  <Skeleton className="h-4 w-24 sm:w-32 mr-1" />
                  <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 ml-1 rounded-full hidden xxs:block" />
                </div>
                <div className="relative h-full min-w-16 md:min-w-20 flex items-center justify-center bg-kanaliiga-light-brown/30 rounded-xs">
                  <Skeleton className="h-5 w-7" />
                  <span className="mx-1 md:mx-2">&mdash;</span>
                  <Skeleton className="h-5 w-7" />
                </div>
                <div className="flex items-center justify-start ml-1">
                  <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 mr-1 rounded-full hidden xxs:block" />
                  <Skeleton className="h-4 w-24 sm:w-32 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
