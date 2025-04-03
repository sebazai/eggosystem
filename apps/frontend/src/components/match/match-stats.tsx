"use client";

import React from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo } from "@eggosystem/types";

import { MatchMapPicks } from "./map-picks";
import { TeamStatistics } from "./statistics/team-statistics";
import { PlayerStatistics } from "./statistics/player-stats-grid";
import { TopPlayers } from "./top-players";
import { useMatchTeamStats } from "@/hooks/data/useMatchTeamStats";
import { useMatchPlayerStats } from "@/hooks/data/useMatchPlayerStats";
import { useMatchTopPlayers } from "@/hooks/data/useMatchTopPlayers";

interface MatchStatsProps {
  matchId: string;
  teams: MatchInfo["teams"];
}

export const MatchStats = ({ matchId, teams }: MatchStatsProps) => {
  const router = useRouter();

  const handleMapSelect = (gameId: string | undefined) => {
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

  return (
    <>
      <MatchMapPicks matchId={matchId} handleMapSelect={handleMapSelect} />
      {teamStats && <TeamStatistics teamStats={teamStats} />}

      {/* Player Stats Grid */}
      {playerStats && (
        <PlayerStatistics playerStats={playerStats} teams={teams} />
      )}
      {/* Top Players */}
      {topPlayers && <TopPlayers topPlayers={topPlayers} teams={teams} />}
    </>
  );
};
