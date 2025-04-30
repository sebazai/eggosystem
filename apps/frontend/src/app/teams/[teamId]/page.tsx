"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/multi-filters";
import { TeamsTable } from "@/components/teams/teams-table";
import { ContentContainer } from "@/components/layout/content-container";
import { useFilters } from "@/context/FilterContext";
import { AutoBreadcrumbs } from "@/components/layout/auto-breadcrumbs";

interface TeamDetailsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const unwrappedParams = React.use(params);
  const teamId = Number(unwrappedParams.teamId);
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;

  return (
    <div className="container mx-auto py-4">
      <AutoBreadcrumbs />
      <MultiFilters
        seasons={filterParams.seasons}
        leagues={filterParams.leagues}
        stages={filterParams.stages}
        teams={[teamId]}
        maps={filterParams.maps}
        hideFilters={{ teams: true }}
      />
      <TeamsTable teamId={teamId} filterQueryParams={filterParams} />
    </div>
  );
}
