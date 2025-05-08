"use client";

import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "@/components/matches/filtered-matches-list";
import _ from "lodash";
import { useFilters } from "@/context/FilterContext";
import { ContentContainer } from "@/components/layout/content-container";

export default function AllMatches() {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Recent matches</h1>
      <div className="py-2">
        <MultiFilters
          seasons={filterParams.seasons}
          leagues={filterParams.leagues}
          stages={filterParams.stages}
          teams={filterParams.teams}
          maps={filterParams.maps}
        />
      </div>

      <FilteredMatchesList filterQueryParams={filterParams} />
    </div>
  );
}
