"use client";

import { TeamMapStatsCards } from "./TeamMapStatsCards";
import { MapPerformanceRadar } from "./MapPerformanceRadar";
import { MapVetoRadar } from "./MapVetoRadar";
import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import { useFilteredTeamMapVetoStats } from "@/hooks/data/filtered/useFilteredTeamMapVetoStats";
import type { FilterParamsQuery } from "@/lib/utils";
import { CardSkeleton } from "@/components/loading";

interface TeamMapStatsTabProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const TeamMapStatsTab = ({
  teamId,
  filterQueryParams
}: TeamMapStatsTabProps) => {
  const { teamMapStats, isLoading } = useFilteredTeamMapStats({
    teamId,
    filterQueryParams
  });

  const { vetoStats, isLoading: isVetoLoading } = useFilteredTeamMapVetoStats({
    teamId,
    filterQueryParams
  });

  // Show loading state while data is being fetched
  if (isLoading || isVetoLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton showHeader={true} contentLines={4} />
          <CardSkeleton showHeader={true} contentLines={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} showHeader={false} contentLines={3} />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no data is available
  const hasMapStats = teamMapStats && teamMapStats.length > 0;
  const hasVetoStats = vetoStats && vetoStats.length > 0;

  if (!hasMapStats && !hasVetoStats) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            No map statistics found for team {teamId} with the provided filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Radar Charts - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Map Performance</h2>
          {hasMapStats ? (
            <MapPerformanceRadar mapStats={teamMapStats} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No map performance data available
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Map Picks & Bans</h2>
          {hasVetoStats ? (
            <MapVetoRadar vetoStats={vetoStats} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No veto data available
            </div>
          )}
        </div>
      </div>

      {/* Map Stats Cards - Only show if we have map stats */}
      {hasMapStats && (
        <TeamMapStatsCards
          teamId={teamId}
          filterQueryParams={filterQueryParams}
        />
      )}
    </div>
  );
};
