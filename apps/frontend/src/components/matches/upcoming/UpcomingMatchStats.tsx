"use client";

import React from "react";
import type { MatchInfo } from "@eggosystem/types";

import { type FilterParamsQuery } from "@/lib/utils";
import { TeamMapBreakdown } from "./TeamMapBreakdown";
import { TeamFormComparison } from "./TeamFormComparison";
import { TeamLineups } from "./TeamLineups";

interface UpcomingMatchStatsProps {
  matchId: number;
  matchInfo: MatchInfo;
}

export const UpcomingMatchStats = ({
  matchId,
  matchInfo
}: UpcomingMatchStatsProps) => {
  // Create base filters object for shared use with correct types
  const baseFilters: FilterParamsQuery = {
    seasons: [matchInfo.season_id],
    leagues: [matchInfo.league_id],
    stages: null,
    teams: null,
    maps: null
  };

  return (
    <div className="p-1 sm:p-3">
      {/* Main Content - Full Width */}
      <div className="space-y-4">
        {/* Team Map Breakdown Section */}
        <TeamMapBreakdown matchInfo={matchInfo} baseFilters={baseFilters} />

        {/* Team Form Comparison */}
        <TeamFormComparison
          teams={Object.values(matchInfo.teams)}
          baseFilters={baseFilters}
        />

        {/* Team Lineups */}
        <TeamLineups
          teams={Object.values(matchInfo.teams)}
          baseFilters={baseFilters}
          matchId={matchId}
        />
      </div>
    </div>
  );
};
