"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/multi-filters";

import { LeaderboardsGrid } from "@/components/leaderboards/leaderboards-grid";

import { useFilters } from "@/context/FilterContext";
import { TheContainer } from "@/components/layout/the-container";

export default function LeaderboardsPage() {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <TheContainer>Loading...</TheContainer>;
  if (error) return <TheContainer>Failed to load filters</TheContainer>;

  return (
    <div className="p-0">
      <MultiFilters {...filterParams} />

      <div className="min-h-fit pb-8 px-4 bg-card">
        <div className="max-w-[1400px] mx-auto">
          <LeaderboardsGrid filterQueryParams={filterParams} />
        </div>
      </div>
    </div>
  );
}
