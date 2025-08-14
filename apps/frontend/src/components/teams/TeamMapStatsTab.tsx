"use client";

import { TeamMapStatsCards } from "./TeamMapStatsCards";
import { MapPerformanceRadar } from "./MapPerformanceRadar";
import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import type { FilterParamsQuery } from "@/lib/utils";
import { useEffect } from "react";

interface TeamMapStatsTabProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const TeamMapStatsTab = ({
  teamId,
  filterQueryParams
}: TeamMapStatsTabProps) => {
  const { teamMapStats, isLoading, mutate } = useFilteredTeamMapStats({
    teamId,
    filterQueryParams
  });

  // Force revalidation when component mounts - helps ensure data is fresh
  useEffect(() => {
    mutate();
  }, [teamId, filterQueryParams, mutate]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Map Performance</h2>

      {/* Radar Chart Overview */}
      {!isLoading && teamMapStats && teamMapStats.length > 0 && (
        <MapPerformanceRadar mapStats={teamMapStats} />
      )}

      {/* Map Stats Cards */}
      <TeamMapStatsCards
        teamId={teamId}
        filterQueryParams={filterQueryParams}
      />
    </div>
  );
};
