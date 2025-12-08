"use client";

import { TeamMapStatsCards } from "./TeamMapStatsCards";
import { MapPerformanceRadar } from "./MapPerformanceRadar";
import { MapVetoRadar } from "./MapVetoRadar";
import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import { useFilteredTeamMapVetoStats } from "@/hooks/data/filtered/useFilteredTeamMapVetoStats";
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

  const {
    vetoStats,
    isLoading: isVetoLoading,
    mutate: mutateVeto
  } = useFilteredTeamMapVetoStats({
    teamId,
    filterQueryParams
  });

  // Force revalidation when component mounts - helps ensure data is fresh
  useEffect(() => {
    mutate();
    mutateVeto();
  }, [teamId, filterQueryParams, mutate, mutateVeto]);

  return (
    <div className="space-y-6">
      {/* Radar Charts - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Map Performance</h2>
          {!isLoading && teamMapStats && teamMapStats.length > 0 && (
            <MapPerformanceRadar mapStats={teamMapStats} />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Map Picks & Bans</h2>
          {!isVetoLoading && vetoStats && vetoStats.length > 0 && (
            <MapVetoRadar vetoStats={vetoStats} />
          )}
        </div>
      </div>

      {/* Map Stats Cards */}
      <TeamMapStatsCards
        teamId={teamId}
        filterQueryParams={filterQueryParams}
      />
    </div>
  );
};
