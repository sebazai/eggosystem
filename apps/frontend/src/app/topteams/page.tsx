"use client";

import React from "react";

import { MultiFilters } from "@/components/filters/multi-filters";
import { TopTeamsGrid } from "@/components/topteams/top-teams-grid";
import { TheContainer } from "@/components/layout/the-container";
import { useFilters } from "@/context/FilterContext";

export default function TopTeamsPage() {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <TheContainer>Loading...</TheContainer>;
  if (error) return <TheContainer>Failed to load filters</TheContainer>;

  return (
    <div>
      <MultiFilters
        seasons={filterParams.seasons}
        leagues={filterParams.leagues}
        stages={filterParams.stages}
        teams={null}
        maps={filterParams.maps}
      />

      <div className="min-h-fit pb-8 px-4 bg-card">
        <div className="max-w-[1400px] mx-auto">
          <TopTeamsGrid filterQueryParams={filterParams} />
        </div>
      </div>
    </div>
  );
}
