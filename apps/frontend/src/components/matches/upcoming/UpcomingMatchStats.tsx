"use client";

import React from "react";
import type { MatchInfo, MatchTeamInfo } from "@eggosystem/types";

// Local interface with teams as array instead of object
interface ProcessedMatchInfo extends Omit<MatchInfo, "teams"> {
  teams: MatchTeamInfo[];
}
import { type FilterParamsQuery } from "@/lib/utils";
import { TeamMapBreakdown } from "./TeamMapBreakdown";
import { TeamFormComparison } from "./TeamFormComparison";
import { TeamLineups } from "./TeamLineups";
import { UpcomingMatchHeader } from "./UpcomingMatchHeader";
import { useMatchStreamUrls } from "@/hooks/data/useMatchStreamUrls";

interface UpcomingMatchStatsProps {
  matchId: number;
  matchInfo: ProcessedMatchInfo;
  platform: string;
  externalMatchRoomUrl: string | null;
}

export const UpcomingMatchStats = ({
  matchId,
  matchInfo,
  platform,
  externalMatchRoomUrl
}: UpcomingMatchStatsProps) => {
  // Fetch stream URLs for this match
  const { streamUrls } = useMatchStreamUrls(matchId);

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
        streamUrls={streamUrls}
      />

      {/* Main Content - Full Width */}
      <div className="space-y-4">
        {/* Team Map Breakdown Section */}
        <TeamMapBreakdown matchInfo={matchInfo} baseFilters={baseFilters} />

        {/* Team Form Comparison */}
        <TeamFormComparison teams={matchInfo.teams} baseFilters={baseFilters} />

        {/* Team Lineups */}
        <TeamLineups
          teams={matchInfo.teams}
          baseFilters={baseFilters}
          matchId={matchId}
        />
      </div>
    </div>
  );
};
