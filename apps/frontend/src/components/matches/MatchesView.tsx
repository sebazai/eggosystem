"use client";

import { Suspense } from "react";
import { useFilters } from "@/context/FilterContext";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { MatchListSkeleton } from "@/components/loading";
import { MatchPageHeader } from "./MatchPageHeader";
import { SummaryStrip } from "./SummaryStrip";
import { FilteredMatchesList } from "./FilteredMatchesList";

export function MatchesView() {
  const { filterParams, activeSeason, isLoading, error, isValidating } =
    useFilters();

  const isFiltersLoading = isLoading || !filterParams || isValidating;

  const { matches } = useRecentMatches(
    filterParams ?? {
      seasons: [],
      leagues: [],
      stages: null,
      teams: null,
      maps: null
    }
  );

  return (
    <div>
      <MatchPageHeader seasonId={activeSeason?.season_id} />

      <div className="mb-4">
        {filterParams && (
          <MultiFilters
            seasons={filterParams.seasons}
            leagues={filterParams.leagues}
            stages={filterParams.stages}
            teams={filterParams.teams}
            maps={filterParams.maps}
          />
        )}
        {!filterParams && (
          <div className="h-10 animate-pulse rounded-md bg-accent" />
        )}
      </div>

      {matches && matches.length > 0 && <SummaryStrip matches={matches} />}

      {isFiltersLoading && <MatchListSkeleton />}
      {!isFiltersLoading && error && (
        <ContentContainer>Failed to load filters</ContentContainer>
      )}
      {!isFiltersLoading && !error && filterParams && (
        <Suspense fallback={<MatchListSkeleton />}>
          <FilteredMatchesList filterQueryParams={filterParams} />
        </Suspense>
      )}
    </div>
  );
}
