"use client";

import React from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo } from "@eggosystem/types";
import { MatchMapPicks } from "./stats/map-picks";
import { TeamStatistics } from "./stats/team-statistics";
import { PlayerStatisticsForTeam } from "./stats/player-stats-grid";
import { TopPlayers } from "./stats/top-players";
import { useMatchTeamStats } from "@/hooks/data/useMatchTeamStats";
import { useMatchPlayerStats } from "@/hooks/data/useMatchPlayerStats";
import { useMatchTopPlayers } from "@/hooks/data/useMatchTopPlayers";

interface MatchStatsProps {
  matchId: number;
  matchInfo: MatchInfo;
}

export const MatchStats = ({ matchId, matchInfo }: MatchStatsProps) => {
  const router = useRouter();

  const handleMapSelect = (gameId: number | undefined) => {
    // Generate the new URL based on the selected gameId
    const newUrl = gameId
      ? `/matches/${matchId}/games/${gameId}`
      : `/matches/${matchId}`;

    // Use router.push or router.replace to navigate without reloading the page
    router.push(newUrl, { scroll: false });
  };

  const { teamStats } = useMatchTeamStats(matchId);
  const { playerStats } = useMatchPlayerStats(matchId);
  const { topPlayers } = useMatchTopPlayers(matchId);

  const baseFilters = {
    seasons: matchInfo.season_id.toString(),
    leagues: matchInfo.league_id.toString()
  };

  return (
    <>
      <MatchMapPicks matchId={matchId} handleMapSelect={handleMapSelect} />
      {teamStats && (
        <TeamStatistics teamStats={teamStats} teamStatsFilters={baseFilters} />
      )}

      {/* Player Stats Grid */}
      {playerStats && (
        <PlayerStatisticsForTeam
          playerStats={playerStats}
          teams={matchInfo.teams}
          playerStatsFilters={baseFilters}
        />
      )}
      {/* Top Players */}
      {topPlayers && (
        <TopPlayers
          topPlayers={topPlayers}
          teams={matchInfo.teams}
          topPlayerFilters={baseFilters}
        />
      )}
    </>
  );
};
