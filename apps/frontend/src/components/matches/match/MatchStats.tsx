"use client";

import React from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo, SeasonPlatform } from "@eggosystem/types";
import { MatchMapPicks } from "./stats/MapPicks";
import { TeamStatistics } from "./stats/TeamStatistics";
import { PlayerStatisticsForTeam } from "./stats/PlayerStatisticsForTeam";
import { TopPlayers } from "./stats/TopPlayers";
import { useMatchTeamStats } from "@/hooks/data/useMatchTeamStats";
import { useMatchPlayerStats } from "@/hooks/data/useMatchPlayerStats";
import { useMatchTopPlayers } from "@/hooks/data/useMatchTopPlayers";
import _ from "lodash";
import { MatchMapsHeader } from "./stats/MatchMapsHeader";

interface MatchStatsProps {
  matchId: number;
  matchInfo: MatchInfo;
  platform: SeasonPlatform;
  externalMatchRoomUrl: string | null;
}

export const MatchStats = ({
  matchId,
  matchInfo,
  externalMatchRoomUrl
}: MatchStatsProps) => {
  const router = useRouter();
  const [selectedStat, setSelectedStat] = React.useState<
    "CT" | "T" | undefined
  >(undefined);

  const handleMapSelect = (matchGameId: number | undefined) => {
    // Generate the new URL based on the selected matchGameId
    const newUrl = matchGameId
      ? `/matches/${matchId}/games/${matchGameId}`
      : `/matches/${matchId}`;

    // Use router.push or router.replace to navigate without reloading the page
    router.push(newUrl, { scroll: false });
  };

  const { teamStats } = useMatchTeamStats(matchId);
  const { playerStats } = useMatchPlayerStats(matchId, selectedStat);
  const { topPlayers } = useMatchTopPlayers(matchId);

  const baseFilters = {
    seasons: matchInfo.season_id.toString(),
    leagues: matchInfo.league_id.toString()
  };

  return (
    <div className="space-y-4 p-1 sm:p-3">
      <MatchMapPicks
        matchId={matchId}
        handleMapSelect={handleMapSelect}
        externalMatchRoomId={matchInfo.external_match_room_id}
      />
      <MatchMapsHeader
        matchId={matchId}
        externalMatchRoomUrl={externalMatchRoomUrl}
        platform={matchInfo.season_platform}
        handleMapSelect={handleMapSelect}
      />

      {teamStats && teamStats.length > 0 && (
        <TeamStatistics teamStats={teamStats} teamStatsFilters={baseFilters} />
      )}

      {/* Player Stats Grid */}
      {playerStats && playerStats.length > 0 && (
        <PlayerStatisticsForTeam
          playerStats={playerStats}
          teams={matchInfo.teams}
          playerStatsFilters={baseFilters}
          selectedStat={selectedStat}
          onStatChange={setSelectedStat}
        />
      )}
      {/* Top Players */}
      {topPlayers && !_.isEmpty(topPlayers) && (
        <TopPlayers
          topPlayers={topPlayers}
          teams={matchInfo.teams}
          topPlayerFilters={baseFilters}
        />
      )}
    </div>
  );
};
