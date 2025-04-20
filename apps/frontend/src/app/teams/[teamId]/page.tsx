"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { MultiFilters } from "@/components/filters/multi-filters";
import { TeamsTable } from "@/components/teams/teams-table";
import { TheContainer } from "@/components/layout/the-container";
import { useFilters } from "@/context/FilterContext";

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
    return <TheContainer>Loading...</TheContainer>;
  if (error) return <TheContainer>Failed to load filters</TheContainer>;

  return (
    <div className="container mx-auto py-4">
      <div className="mb-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/teams">Teams</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{teamId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
        Filter Statistics
      </h2>

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
