"use client";

import { useFilters } from "@/context/FilterContext";
import { MultiFilters } from "../filters/MultiFilters";
import { TeamsTable } from "./TeamsTable";
import { ContentContainer } from "../layout/ContentContainer";

export const TeamPageWithFilters = ({ teamId }: { teamId: number }) => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;
  return (
    <>
      <MultiFilters
        seasons={filterParams.seasons}
        leagues={filterParams.leagues}
        stages={filterParams.stages}
        teams={[teamId]}
        maps={filterParams.maps}
        hideFilters={{ teams: true }}
      />
      <TeamsTable teamId={teamId} filterQueryParams={filterParams} />
    </>
  );
};
