"use client";

import React from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo } from "@eggosystem/types";
import { useMatchGamePlayerStats } from "@/hooks/data/useMatchGamePlayerStats";
import { MatchMapPicks } from "../stats/map-picks";
import { TeamStatistics } from "../stats/team-statistics";
import { useMatchGameTeamStats } from "@/hooks/data/useMatchGameTeamStats";
import { useMatchGameRoundInfo } from "@/hooks/data/useMatchGameRoundInfo";
import { RoundInfo } from "../stats/round-info";
import { PlayerStatistics } from "../stats/player-stats-grid";
import { TopPlayers } from "../stats/top-players";
import { useMatchGameTopPlayers } from "@/hooks/data/useMatchGameTopPlayers";

interface MatchStatsProps {
  matchId: number;
  gameId: number;
  matchInfo: MatchInfo;
}

export const GameStats = ({ matchId, gameId, matchInfo }: MatchStatsProps) => {
  const router = useRouter();

  const handleMapSelect = (gameId: number | undefined) => {
    // Generate the new URL based on the selected gameId
    const newUrl = gameId
      ? `/matches/${matchId}/games/${gameId}`
      : `/matches/${matchId}`;

    // Use router.push or router.replace to navigate without reloading the page
    router.push(newUrl, { scroll: false });
  };

  const { teamStats } = useMatchGameTeamStats(matchId, gameId);
  const { playerStats } = useMatchGamePlayerStats(matchId, gameId);
  const { topPlayers } = useMatchGameTopPlayers(matchId, gameId);
  const { roundInfo } = useMatchGameRoundInfo(matchId, gameId);

  const baseFilter = {
    seasons: matchInfo.season_id.toString(),
    leagues: matchInfo.league_id.toString()
  };

  return (
    <>
      <MatchMapPicks
        gameId={gameId}
        matchId={matchId}
        handleMapSelect={handleMapSelect}
      />
      {teamStats && (
        <TeamStatistics teamStats={teamStats} teamStatsFilters={baseFilter} />
      )}
      {/* Round Score */}
      {roundInfo && roundInfo.length > 0 && <RoundInfo roundInfo={roundInfo} />}

      {/* Player Stats Grid */}
      {playerStats && (
        <PlayerStatistics
          playerStats={playerStats}
          teams={matchInfo.teams}
          playerStatsFilters={baseFilter}
        />
      )}
      {/* Top Players */}
      {topPlayers && (
        <TopPlayers
          topPlayers={topPlayers}
          teams={matchInfo.teams}
          topPlayerFilters={baseFilter}
        />
      )}
    </>
  );
};
