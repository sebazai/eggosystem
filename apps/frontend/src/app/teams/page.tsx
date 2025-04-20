"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/multi-filters";
import { TeamsGrid } from "@/components/teams/teams-grid";
import { TheContainer } from "@/components/layout/the-container";
import { useFilters } from "@/context/FilterContext";

export default function TeamsPage() {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <TheContainer>Loading...</TheContainer>;
  if (error) return <TheContainer>Failed to load filters</TheContainer>;

  return (
    <div className="p-0">
      <MultiFilters
        seasons={filterParams.seasons}
        leagues={filterParams.leagues}
        teams={filterParams.teams}
        stages={null}
        maps={null}
      />

      <div
        className="min-h-fit pb-8 px-4"
        style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-kanaliiga-orange text-3xl font-bold py-8">
            Teams
          </h1>

          <TeamsGrid filterQueryParams={filterParams} />
        </div>
      </div>
    </div>
  );
}
