"use client";

import React from "react";

import { MultiFilters } from "@/components/filters/MultiFilters";
import { TopTeamsGrid } from "@/components/topteams/TopTeamsGrid";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { useFilters } from "@/context/FilterContext";
import { CardContainer } from "@/components/layout/CardContainer";

export const TopTeamsPage = () => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Top Teams</h1>
      <div className="pb-4">
        <MultiFilters
          seasons={filterParams.seasons}
          leagues={filterParams.leagues}
          stages={filterParams.stages}
          teams={null}
          maps={filterParams.maps}
          hideFilters={{ teams: true }}
        />
      </div>

      <CardContainer classNames="p-2 md:p-4">
        <TopTeamsGrid filterQueryParams={filterParams} />
      </CardContainer>
    </div>
  );
};
