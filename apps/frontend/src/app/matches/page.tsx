"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRecentMatches } from "@/hooks/data/useRecentMatches";
import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "@/components/matches/filtered-matches-list";
import { TheContainer } from "@/components/layout/the-container";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";

export default function AllMatches() {
  const searchParams = useSearchParams();

  const params = useMemo(
    () =>
      ({
        seasons: getParamArray(searchParams, "seasons"),
        leagues: getParamArray(searchParams, "leagues"),
        stages: getParamArray(searchParams, "stages"),
        teams: getParamArray(searchParams, "teams"),
        maps: null
      }) satisfies FilterParamsQuery,
    [searchParams]
  );

  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(params);

  if (isError) {
    return <TheContainer>Error loading Matches</TheContainer>;
  }

  return (
    <div className="p-0">
      <h1>Recent matches</h1>
      <div className="py-2">
        <MultiFilters
          seasons={params.seasons}
          leagues={params.leagues}
          stages={params.stages}
          teams={params.teams}
          maps={params.maps}
        />
      </div>

      <FilteredMatchesList
        matches={matches}
        isLoading={isLoading || isValidating}
      />
    </div>
  );
}
