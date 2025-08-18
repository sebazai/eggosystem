"use client";

import React from "react";
import type { MatchInfo } from "@eggosystem/types";
import { type FilterParamsQuery } from "@/lib/utils";
import { TeamMapBreakdown } from "./TeamMapBreakdown";
import { TeamFormComparison } from "./TeamFormComparison";
import { TeamLineups } from "./TeamLineups";
import { UpcomingMatchHeader } from "./UpcomingMatchHeader";
import { UpcomingMapPicks } from "./UpcomingMapPicks";

interface UpcomingMatchStatsProps {
  matchId: number;
  matchInfo: MatchInfo;
  platform: string;
  externalMatchRoomUrl: string | null;
}

export const UpcomingMatchStats = ({
  matchId,
  matchInfo,
  platform,
  externalMatchRoomUrl
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
      <UpcomingMatchHeader
        matchId={matchId}
        matchInfo={matchInfo}
        externalMatchRoomUrl={externalMatchRoomUrl}
        platform={platform}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4">
        {/* Upcoming Maps (TBA) - Left Side */}
        <div>
          <UpcomingMapPicks matchInfo={matchInfo} />
        </div>

        {/* Main Content - Right Side */}
        <div className="space-y-4">
          {/* Team Map Breakdown Section */}
          <TeamMapBreakdown matchInfo={matchInfo} baseFilters={baseFilters} />

          {/* Team Form Comparison */}
          <TeamFormComparison
            teams={matchInfo.teams}
            baseFilters={baseFilters}
          />

          {/* Team Lineups */}
          <TeamLineups teams={matchInfo.teams} baseFilters={baseFilters} />
        </div>
      </div>
    </div>
  );
};
