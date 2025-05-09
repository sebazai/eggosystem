import React from "react";
import { ContentContainer } from "../layout/content-container";
import { Skeleton } from "../ui/skeleton";

interface StatsGridProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  isError: Error | null;
  renderHeader: (section: T) => React.ReactNode;
  renderRow: (section: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  loadingSkeleton?: React.ReactNode;
  testId?: string;
}

export function StatsGrid<T>({
  data,
  isLoading,
  isError,
  renderHeader,
  renderRow,
  emptyMessage = "No data available.",
  loadingSkeleton = <StatGridSkeleton />,
  testId
}: StatsGridProps<T>) {
  if (isLoading) return loadingSkeleton;
  if (isError)
    return (
      <ContentContainer>
        {isError.message || "Error loading data."}
      </ContentContainer>
    );
  if (!data || data.length === 0)
    return (
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-kanaliiga-orange py-8">
          No Results
        </h1>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid={testId}>
      {data.map((section, index) => (
        <div
          key={index}
          className="bg-card rounded-sm overflow-hidden"
          data-testid={`${testId}-section-${index}`}
        >
          <div className="bg-kanaliiga-orange/30 p-4">
            {renderHeader(section)}
          </div>
          <div className="p-4">{renderRow(section, index)}</div>
        </div>
      ))}
    </div>
  );
}

const StatGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-card rounded-sm overflow-hidden">
        <div className="bg-kanaliiga-orange/30 p-4">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, playerIndex) => (
            <div
              key={playerIndex}
              className={`flex items-center justify-between py-3 px-2`}
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
