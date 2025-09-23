"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { TeamsGrid } from "@/components/teams/TeamsGrid";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { useFilters } from "@/context/FilterContext";
import { CardContainer } from "@/components/layout/CardContainer";

export default function TeamsPage() {
  const { filterParams, isLoading, error, isValidating, areFiltersEmpty } =
    useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Teams</h1>
      <div className="pb-2">
        <MultiFilters
          seasons={filterParams.seasons}
          leagues={filterParams.leagues}
          teams={filterParams.teams}
          stages={null}
          maps={null}
          hideFilters={{ stages: true, maps: true }}
          sortOrder={["teams", "seasons", "leagues"]}
        />
      </div>

      <CardContainer classNames="p-2 md:p-4">
        {areFiltersEmpty ? (
          <ContentContainer classNames="min-h-[30vh]">
            Please select one filter.
          </ContentContainer>
        ) : (
          <TeamsGrid filterQueryParams={filterParams} />
        )}
      </CardContainer>
    </div>
  );
}
