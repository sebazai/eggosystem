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
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { TeamsTable } from "@/components/teams/teams-table";
import { TheContainer } from "@/components/layout/the-container";

interface TeamDetailsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const unwrappedParams = React.use(params);
  const teamId = unwrappedParams.teamId;
  const activeSeasonHook = useActiveSeason("730");

  if (!activeSeasonHook.filterParams) {
    return <TheContainer>Fetching active season...</TheContainer>;
  }

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
      <WithActiveSeason>
        <MultiFilters
          seasons={activeSeasonHook.filterParams.seasons}
          leagues={activeSeasonHook.filterParams.leagues}
          stages={activeSeasonHook.filterParams.stages}
          teams={null}
          maps={activeSeasonHook.filterParams.maps}
        />

        <TeamsTable
          teamId={teamId}
          filterQueryParams={activeSeasonHook.filterParams}
        />
      </WithActiveSeason>
    </div>
  );
}
