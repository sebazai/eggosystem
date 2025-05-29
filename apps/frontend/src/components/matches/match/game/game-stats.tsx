"use client";

import React from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo, SeasonPlatform } from "@eggosystem/types";
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
import { MatchMapsHeader } from "../stats/match-maps-header";
import { useGameClip } from "@/hooks/data/useGameClip";

interface MatchStatsProps {
  matchId: number;
  gameId: number;
  platform: SeasonPlatform;
  matchInfo: MatchInfo;
  externalMatchRoomUrl: string | null;
}

export const GameStats = ({
  matchId,
  gameId,
  platform,
  matchInfo,
  externalMatchRoomUrl
}: MatchStatsProps) => {
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
  const { clip } = useGameClip(gameId);

  const baseFilter = {
    seasons: matchInfo.season_id.toString(),
    leagues: matchInfo.league_id.toString()
  };

  return (
    <div className="space-y-4 sm:space-y-10 p-1 sm:p-3">
      <MatchMapPicks matchId={matchId} handleMapSelect={handleMapSelect} />

      <MatchMapsHeader
        matchId={matchId}
        gameId={gameId}
        platform={platform}
        externalMatchRoomUrl={externalMatchRoomUrl}
        handleMapSelect={handleMapSelect}
      />

      {teamStats && teamStats.length > 0 && (
        <TeamStatistics
          teamStats={teamStats}
          teamStatsFilters={baseFilter}
          gameId={gameId}
          clip={clip}
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
    </div>
  );
};
