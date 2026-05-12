"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  contentLines?: number;
}

export function CardSkeleton({
  className,
  showHeader = true,
  showContent = true,
  contentLines = 3
}: CardSkeletonProps) {
  return (
    <div
      className={cn("bg-card rounded-md overflow-hidden border-0", className)}
    >
      {showHeader && (
        <div className="bg-kanaliiga-light-brown/30 p-4 border-b border-border">
          <Skeleton className="h-6 w-3/4" />
        </div>
      )}
      {showContent && (
        <div className="p-4 space-y-3">
          {Array.from({ length: contentLines }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                "h-4",
                index === contentLines - 1 ? "w-2/3" : "w-full"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
