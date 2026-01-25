"use client";

import React from "react";

import { MultiFilters } from "@/components/filters/MultiFilters";
import { TopTeamsGrid } from "@/components/topteams/TopTeamsGrid";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { useFilters } from "@/context/FilterContext";
import { CardContainer } from "@/components/layout/CardContainer";
import { PageSkeleton } from "@/components/loading";

export const TopTeamsPage = () => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  const isFiltersLoading = isLoading || !filterParams || isValidating;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Top Teams</h1>
      <div className="pb-2">
        {filterParams && (
          <MultiFilters
            seasons={filterParams.seasons}
            leagues={filterParams.leagues}
            stages={filterParams.stages}
            teams={null}
            maps={filterParams.maps}
            hideFilters={{ teams: true }}
          />
        )}
        {!filterParams && (
          <div className="h-10 bg-accent animate-pulse rounded-md" />
        )}
      </div>

      <CardContainer classNames="p-2 md:p-4">
        {isFiltersLoading && <PageSkeleton />}
        {!isFiltersLoading && error && (
          <ContentContainer>Failed to load filters</ContentContainer>
        )}
        {!isFiltersLoading && !error && filterParams && (
          <TopTeamsGrid filterQueryParams={filterParams} />
        )}
      </CardContainer>
    </div>
  );
};
