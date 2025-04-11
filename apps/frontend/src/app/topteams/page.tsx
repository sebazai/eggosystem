"use client";

import React, { useMemo } from "react";

import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useTopTeams } from "@/hooks/data/useTopTeams";
import { TopTeamsGrid } from "@/components/topteams/top-teams-grid";
import { TheContainer } from "@/components/layout/the-container";

export default function TopTeamsPage() {
  const searchParams = useSearchParams();
  const initialParams = useMemo(
    () =>
      ({
        seasons: getParamArray(searchParams, "seasons"),
        leagues: getParamArray(searchParams, "leagues"),
        stages: getParamArray(searchParams, "stages"),
        teams: null,
        maps: getParamArray(searchParams, "maps")
      }) satisfies FilterParamsQuery,
    [searchParams]
  );

  const { isError, isLoading, isValidating, divisions } =
    useTopTeams(initialParams);

  if (isError) {
    return (
      <TheContainer>
        {isError?.message ?? "Error loading top teams"}
      </TheContainer>
    );
  }

  return (
    <div className="p-0">
      <MultiFilters
        seasons={initialParams.seasons}
        leagues={initialParams.leagues}
        stages={initialParams.stages}
        teams={null}
        maps={initialParams.maps}
      />

      <div
        className="min-h-fit pb-8 px-4"
        style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
      >
        <div className="max-w-[1400px] mx-auto">
          <TopTeamsGrid
            divisions={divisions}
            isLoading={isLoading || isValidating}
          />
        </div>
      </div>
    </div>
  );
}
