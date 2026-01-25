"use client";

import { MultiFilters } from "@/components/filters/MultiFilters";
import { FilteredMatchesList } from "@/components/matches/FilteredMatchesList";
import _ from "lodash";
import { useFilters } from "@/context/FilterContext";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Suspense } from "react";
import { MatchListSkeleton } from "@/components/loading";

export const RecentMatches = () => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  const isFiltersLoading = isLoading || !filterParams || isValidating;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Recent matches</h1>
      <div className="pb-2">
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
          <div className="h-10 bg-accent animate-pulse rounded-md" />
        )}
      </div>

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
};
