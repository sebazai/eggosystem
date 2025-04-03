"use client";

import { useMemo } from "react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useRecentMatches } from "@/hooks/data/useRecentMatches";
import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "@/components/match/filtered-matches-list";
import { envConfig } from "@/configs/env";
import { TheContainer } from "@/components/layout/the-container";

const getParamArray = (searchParams: ReadonlyURLSearchParams, key: string) =>
  searchParams
    .getAll(key)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort();

export default function AllMatches() {
  const searchParams = useSearchParams();
  const activeSeason = envConfig.ACTIVE_SEASON;

  const initialParams = useMemo(
    () => ({
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: []
    }),
    [searchParams]
  );

  if (initialParams.seasons.length === 0) {
    initialParams.seasons = [activeSeason];
  }

  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(initialParams);

  if (isError) {
    return <TheContainer>Error loading Matches</TheContainer>;
  }

  return (
    <div className="p-0">
      <h1>Recent matches</h1>
      <div className="py-2">
        <MultiFilters
          seasons={initialParams.seasons}
          leagues={initialParams.leagues}
          stages={initialParams.stages}
          teams={initialParams.teams}
          maps={initialParams.maps}
        />
      </div>

      <FilteredMatchesList
        matches={matches}
        isLoading={isLoading || isValidating}
      />
    </div>
  );
}
