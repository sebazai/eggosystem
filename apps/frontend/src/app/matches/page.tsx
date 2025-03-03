"use client";

import { Suspense, useMemo } from "react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useRecentMatches } from "@/hooks/data/useRecentMatches";
import MatchContainer from "./match-container";
import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "./filtered-matches-list";

const getParamArray = (searchParams: ReadonlyURLSearchParams, key: string) =>
  searchParams
    .getAll(key)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort();

export default function AllMatches() {
  const searchParams = useSearchParams();

  const initialParams = useMemo(
    () => ({
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
    }),
    [searchParams]
  );

  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(initialParams);

  if (isError) {
    return (
      <MatchContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          Error loading Matches
        </div>
      </MatchContainer>
    );
  }

  return (
    <MatchContainer>
      <Suspense>
        <div className="p-0">
          <MultiFilters
            seasons={initialParams.seasons}
            leagues={initialParams.leagues}
            stages={initialParams.stages}
            teams={initialParams.teams}
            maps={initialParams.maps}
          />

          <FilteredMatchesList
            matches={matches}
            isLoading={isLoading || isValidating}
          />
        </div>
      </Suspense>
    </MatchContainer>
  );
}
