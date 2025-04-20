"use client";

import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "@/components/matches/filtered-matches-list";
import _ from "lodash";
import { useFilters } from "@/context/FilterContext";
import { TheContainer } from "@/components/layout/the-container";

export default function AllMatches() {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <TheContainer>Loading...</TheContainer>;
  if (error) return <TheContainer>Failed to load filters</TheContainer>;

  return (
    <div className="p-0">
      <h1>Recent matches</h1>
      <div className="py-2">
        <MultiFilters
          seasons={filterParams.seasons}
          leagues={filterParams.leagues}
          stages={filterParams.stages}
          teams={filterParams.teams}
          maps={null}
        />
      </div>

      <FilteredMatchesList filterQueryParams={filterParams} />
    </div>
  );
}
