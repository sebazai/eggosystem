"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface MatchListSkeletonProps {
  items?: number;
  className?: string;
}

function MatchCardSkeleton() {
  return (
    <div className="mb-2 hidden overflow-hidden rounded-xl border border-white/8 bg-white/5 lg:grid lg:grid-cols-[6px_240px_1fr_220px]">
      <div className="h-full bg-white/10" />
      <div className="flex flex-col gap-2 border-r border-white/8 px-4 py-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="flex flex-col justify-center px-4 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-sm" />
          </div>
          <div className="flex items-center gap-1 px-2">
            <Skeleton className="h-7 w-6" />
            <span className="opacity-20 text-xl">—</span>
            <Skeleton className="h-7 w-6" />
          </div>
          <div className="flex items-center justify-start gap-2">
            <Skeleton className="h-10 w-10 rounded-sm" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between border-l border-white/8 px-4 py-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  );
}

function MatchCardSkeletonMobile() {
  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-white/8 bg-white/5 md:hidden">
      <div className="flex flex-col gap-2 px-3 py-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-6 rounded-sm" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-1 px-1">
            <Skeleton className="h-6 w-4" />
            <span className="opacity-20">—</span>
            <Skeleton className="h-6 w-4" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-6 rounded-sm" />
          </div>
        </div>
        <div className="flex justify-between border-t border-white/8 pt-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function MatchListSkeleton({
  items = 8,
  className
}: MatchListSkeletonProps) {
  const perGroup = 3;
  const groups = Math.ceil(items / perGroup);

  return (
    <div className={className ?? ""}>
      {Array.from({ length: groups }).map((_, gi) => (
        <div key={gi} className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-4 w-28" />
            <div className="flex-1 border-t border-white/8" />
            <Skeleton className="h-3 w-16" />
          </div>
          {Array.from({ length: perGroup }).map((_, mi) => (
            <div key={mi}>
              <MatchCardSkeleton />
              <MatchCardSkeletonMobile />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
