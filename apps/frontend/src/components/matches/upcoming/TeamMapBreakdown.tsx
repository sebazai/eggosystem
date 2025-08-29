"use client";

import React, { useMemo } from "react";
import type { MatchInfo, MatchTeamInfo, Team } from "@eggosystem/types";

// Local interface with teams as array instead of object
interface ProcessedMatchInfo extends Omit<MatchInfo, "teams"> {
  teams: MatchTeamInfo[];
}
import { type FilterParamsQuery } from "@/lib/utils";
import { MapPerformanceRadarSection, MapComparisonCard } from "./components";
import { useTeamMapStats } from "@/hooks/data/useTeamMapStats";

interface TeamMapBreakdownProps {
  matchInfo: ProcessedMatchInfo;
  baseFilters: FilterParamsQuery;
}

export const TeamMapBreakdown = ({
  matchInfo,
  baseFilters
}: TeamMapBreakdownProps) => {
  // Get team IDs from matchInfo (typed with indexed access)
  const team1Id: Team["id"] | undefined = matchInfo.teams?.[0]?.id;
  const team2Id: Team["id"] | undefined = matchInfo.teams?.[1]?.id;

  // Fetch real data from APIs - first try with filters, then without filters as fallback
  const { mapStats: team1MapStats, isLoading: isLoadingTeam1 } =
    useTeamMapStats(team1Id || 0, baseFilters);
  const { mapStats: team2MapStats, isLoading: isLoadingTeam2 } =
    useTeamMapStats(team2Id || 0, baseFilters);

  // Fallback: fetch without filters if filtered results are empty
  const { mapStats: team1MapStatsFallback, isLoading: isLoadingTeam1Fallback } =
    useTeamMapStats(team1Id || 0, {
      seasons: null,
      leagues: null,
      stages: null,
      teams: null,
      maps: null
    });
  const { mapStats: team2MapStatsFallback, isLoading: isLoadingTeam2Fallback } =
    useTeamMapStats(team2Id || 0, {
      seasons: null,
      leagues: null,
      stages: null,
      teams: null,
      maps: null
    });

  // Use fallback data if filtered data is empty
  const finalTeam1MapStats =
    team1MapStats && team1MapStats.length > 0
      ? team1MapStats
      : team1MapStatsFallback;
  const finalTeam2MapStats =
    team2MapStats && team2MapStats.length > 0
      ? team2MapStats
      : team2MapStatsFallback;

  // Check if we have real data for both teams
  const hasTeam1Data = finalTeam1MapStats && finalTeam1MapStats.length > 0;
  const hasTeam2Data = finalTeam2MapStats && finalTeam2MapStats.length > 0;
  const hasAnyMapData = hasTeam1Data || hasTeam2Data;

  // Get all unique maps from both teams (only from real data)
  const allMapNames = useMemo(() => {
    const mapNames = new Set<string>();

    // Add maps from team 1 real data
    if (finalTeam1MapStats && finalTeam1MapStats.length > 0) {
      finalTeam1MapStats.forEach((stat) => mapNames.add(stat.map_name));
    }

    // Add maps from team 2 real data
    if (finalTeam2MapStats && finalTeam2MapStats.length > 0) {
      finalTeam2MapStats.forEach((stat) => mapNames.add(stat.map_name));
    }

    return Array.from(mapNames).sort();
  }, [finalTeam1MapStats, finalTeam2MapStats]);

  // Create display data using only real data (no mock fallbacks)
  const displayTeam1MapStats = finalTeam1MapStats || [];
  const displayTeam2MapStats = finalTeam2MapStats || [];

  // Show loading state
  const isLoading =
    isLoadingTeam1 ||
    isLoadingTeam2 ||
    ((!team1MapStats || team1MapStats.length === 0) &&
      isLoadingTeam1Fallback) ||
    ((!team2MapStats || team2MapStats.length === 0) && isLoadingTeam2Fallback);

  if (isLoading) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4 text-kanaliiga-orange">
            MAP PERFORMANCE
          </h2>
          <div className="text-center py-8">Loading map statistics...</div>
        </div>
      </div>
    );
  }

  // Get team names safely (teams is now an array, typed with indexed access)
  const team1Name: Team["name"] = matchInfo.teams?.[0]?.name || "Team 1";
  const team2Name: Team["name"] = matchInfo.teams?.[1]?.name || "Team 2";

  // Render map stats or empty state
  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4 text-kanaliiga-orange">
          MAP PERFORMANCE
        </h2>

        {hasAnyMapData ? (
          <>
            {/* Radar Chart */}
            <MapPerformanceRadarSection
              team1MapStats={displayTeam1MapStats}
              team2MapStats={displayTeam2MapStats}
              team1Name={team1Name}
              team2Name={team2Name}
            />

            {/* Individual Map Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {allMapNames.map((mapName) => {
                const team1Stat = displayTeam1MapStats.find(
                  (stat) => stat.map_name === mapName
                );
                const team2Stat = displayTeam2MapStats.find(
                  (stat) => stat.map_name === mapName
                );

                // Skip if neither team has data for this map
                if (!team1Stat && !team2Stat) return null;

                // Create fallback stats for teams with no data on this map
                const fallbackStat = {
                  map_id: 0,
                  map_name: mapName,
                  maps_played: 0,
                  wins: 0,
                  losses: 0,
                  win_percentage: 0,
                  avg_score: "0",
                  avg_opponent_score: "0",
                  ct_win_percentage: 0,
                  t_win_percentage: 0,
                  ct_kd: "0.00",
                  t_kd: "0.00",
                  kills_ct: 0,
                  deaths_ct: 0,
                  kills_t: 0,
                  deaths_t: 0
                };

                return (
                  <MapComparisonCard
                    key={mapName}
                    team1Stat={team1Stat || fallbackStat}
                    team2Stat={team2Stat || fallbackStat}
                    team1Name={team1Name}
                    team2Name={team2Name}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">
                No Map Statistics Available
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Map performance data is not available for these teams in the
                selected time period. Try adjusting your filters or check back
                later.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
