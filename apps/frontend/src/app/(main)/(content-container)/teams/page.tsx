"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { TeamsGrid } from "@/components/teams/TeamsGrid";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { useFilters } from "@/context/FilterContext";
import { CardContainer } from "@/components/layout/CardContainer";
import { PageSkeleton } from "@/components/loading";

export default function TeamsPage() {
  const { filterParams, isLoading, error, isValidating, areFiltersEmpty } =
    useFilters();

  const isFiltersLoading = isLoading || !filterParams || isValidating;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Teams</h1>
      <div className="pb-2">
        {filterParams && (
          <MultiFilters
            seasons={filterParams.seasons}
            leagues={filterParams.leagues}
            teams={filterParams.teams}
            stages={null}
            maps={null}
            hideFilters={{ stages: true, maps: true }}
            sortOrder={["teams", "seasons", "leagues"]}
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
        {!isFiltersLoading && !error && areFiltersEmpty && (
          <ContentContainer classNames="min-h-[30vh]">
            Please select one filter.
          </ContentContainer>
        )}
        {!isFiltersLoading && !error && !areFiltersEmpty && filterParams && (
          <TeamsGrid filterQueryParams={filterParams} />
        )}
      </CardContainer>
    </div>
  );
}
