"use client";

import React from "react";

import { MultiFilters } from "@/components/filters/multi-filters";
import { TopTeamsGrid } from "@/components/topteams/top-teams-grid";
import { ContentContainer } from "@/components/layout/content-container";
import { useFilters } from "@/context/FilterContext";
import { CardContainer } from "@/components/layout/card-container";

export const TopTeamsPage = () => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Top Teams</h1>
      <MultiFilters
        seasons={filterParams.seasons}
        leagues={filterParams.leagues}
        stages={filterParams.stages}
        teams={null}
        maps={filterParams.maps}
      />

      <CardContainer classNames="p-2 md:p-4">
        <TopTeamsGrid filterQueryParams={filterParams} />
      </CardContainer>
    </div>
  );
};
