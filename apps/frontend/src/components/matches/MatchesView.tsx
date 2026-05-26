"use client";

import { Suspense } from "react";
import { useFilters } from "@/context/FilterContext";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { MatchListSkeleton } from "@/components/loading";
import { MatchPageHeader } from "./MatchPageHeader";
import { SummaryStrip } from "./SummaryStrip";
import { FilteredMatchesList } from "./FilteredMatchesList";
import { FilterBarDesktop } from "./FilterBarDesktop";
import { FilterBarMobile } from "./FilterBarMobile";

export function MatchesView() {
  const { filterParams, isLoading, error, isValidating } = useFilters();

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

  const seasonCount = filterParams?.seasons?.length ?? 1;
  const showSeasonCounts = seasonCount !== 1;

  return (
    <div className="min-w-0 w-full">
      <MatchPageHeader />

      <div className="mb-4 space-y-2">
        {filterParams ? (
          <>
            <FilterBarDesktop filterParams={filterParams} />
            <FilterBarMobile filterParams={filterParams} />
          </>
        ) : (
          <div className="h-10 animate-pulse rounded-md bg-accent" />
        )}
      </div>

      {matches && matches.length > 0 && filterParams && (
        <SummaryStrip
          matches={matches}
          showSeasonCounts={showSeasonCounts}
          filterParams={filterParams}
        />
      )}

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
