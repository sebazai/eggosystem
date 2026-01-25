"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface TeamCardSkeletonProps {
  count?: number;
}

export function TeamCardSkeleton({ count = 1 }: TeamCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card rounded-md overflow-hidden">
          <div className="bg-kanaliiga-light-brown/30 p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Skeleton className="w-[60px] h-[60px] rounded" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, statIndex) => (
                <div key={statIndex} className="text-center space-y-2">
                  <Skeleton className="h-3 w-12 mx-auto" />
                  <Skeleton className="h-5 w-8 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
