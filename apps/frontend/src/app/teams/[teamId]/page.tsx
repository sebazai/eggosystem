"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { MultiFilters } from "@/components/filters/multi-filters";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { TeamsTable } from "@/components/teams/teams-table";

interface TeamDetailsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const unwrappedParams = React.use(params);
  const teamId = unwrappedParams.teamId;
  const activeSeasonHook = useActiveSeason("730");
  const searchParams = useSearchParams();

  // Get filter params from URL
  const filterParams = useMemo(() => {
    const seasons = getParamArray(searchParams, "seasons");
    const activeSeason = activeSeasonHook.activeSeason?.season_id;
    return {
      seasons:
        activeSeason && seasons.length === 0 && searchParams.size === 0
          ? [activeSeason]
          : seasons,
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: null,
      maps: getParamArray(searchParams, "maps")
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

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
          seasons={filterParams.seasons}
          leagues={filterParams.leagues}
          stages={filterParams.stages}
          teams={null}
          maps={filterParams.maps}
        />

        <TeamsTable teamId={teamId} filterQueryParams={filterParams} />
      </WithActiveSeason>
    </div>
  );
}
