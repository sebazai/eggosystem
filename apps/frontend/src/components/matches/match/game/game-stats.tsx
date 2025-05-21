"use client";

import React from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo } from "@eggosystem/types";
import { useGamePlayerStats } from "@/hooks/data/useGamePlayerStats";
import { MatchMapPicks } from "../stats/map-picks";
import { TeamStatistics } from "../stats/team-statistics";
import { useGameTeamStats } from "@/hooks/data/useGameTeamStats";
import { useGameRoundInfo } from "@/hooks/data/useGameRoundInfo";
import { RoundInfo } from "../stats/round-info";
import { PlayerStatisticsForTeam } from "../stats/player-stats-grid";
import { TopPlayers } from "../stats/top-players";
import { useGameTopPlayers } from "@/hooks/data/useGameTopPlayers";
import _ from "lodash";

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

  const { teamStats } = useGameTeamStats(gameId);
  const { playerStats } = useGamePlayerStats(gameId);
  const { topPlayers } = useGameTopPlayers(gameId);
  const { roundInfo } = useGameRoundInfo(gameId);

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

      {teamStats && teamStats.length > 0 && (
        <TeamStatistics
          teamStats={teamStats}
          teamStatsFilters={baseFilter}
          gameId={gameId}
        />
      )}

      {roundInfo && roundInfo.length > 0 && <RoundInfo roundInfo={roundInfo} />}

      {playerStats && playerStats.length > 0 && (
        <PlayerStatisticsForTeam
          playerStats={playerStats}
          teams={matchInfo.teams}
          playerStatsFilters={baseFilter}
        />
      )}

      {topPlayers && !_.isEmpty(topPlayers) && (
        <TopPlayers
          topPlayers={topPlayers}
          teams={matchInfo.teams}
          topPlayerFilters={baseFilter}
        />
      )}
    </>
  );
};
