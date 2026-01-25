import React from "react";
import { ContentContainer } from "../layout/ContentContainer";
import { StatsGridSkeleton } from "../loading";

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
  loadingSkeleton = <StatsGridSkeleton />,
  testId
}: StatsGridProps<T>) {
  if (isLoading) return loadingSkeleton;
  if (isError)
    return (
      <ContentContainer>
        {isError?.message || "Error loading data."}
      </ContentContainer>
    );
  if (!data || data.length === 0)
    return (
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold py-8">No Results</h1>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid={testId}>
      {data.map((section, index) => (
        <div
          key={index}
          className="rounded-sm overflow-hidden"
          data-testid={`${testId}-section-${index}`}
        >
          <div className="bg-kanaliiga-light-brown/30 p-4">
            {renderHeader(section)}
          </div>
          <div className="bg-white/10 p-4">{renderRow(section, index)}</div>
        </div>
      ))}
    </div>
  );
}
