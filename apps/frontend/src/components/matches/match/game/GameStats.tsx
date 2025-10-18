"use client";

import React from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo, SeasonPlatform } from "@eggosystem/types";
import { useGamePlayerStats } from "@/hooks/data/useGamePlayerStats";
import { MatchMapPicks } from "../stats/MapPicks";
import { TeamStatistics } from "../stats/TeamStatistics";
import { useGameTeamStats } from "@/hooks/data/useGameTeamStats";
import { useGameRoundInfo } from "@/hooks/data/useGameRoundInfo";
import { RoundInfo } from "../stats/RoundRows";
import { PlayerStatisticsForTeam } from "../stats/PlayerStatisticsForTeam";
import { TopPlayers } from "../stats/TopPlayers";
import { useGameTopPlayers } from "@/hooks/data/useGameTopPlayers";
import _ from "lodash";
import { MatchMapsHeader } from "../stats/MatchMapsHeader";
import { useGameClip } from "@/hooks/data/useGameClip";
import { Viewer } from "@eggosystem/viewer";

interface MatchStatsProps {
  matchId: number;
  matchGameId: number;
  platform: SeasonPlatform;
  matchInfo: MatchInfo;
  externalMatchRoomId: string | null;
  externalMatchRoomUrl: string | null;
}

export const GameStats = ({
  matchId,
  matchGameId,
  platform,
  matchInfo,
  externalMatchRoomId,
  externalMatchRoomUrl
}: MatchStatsProps) => {
  const router = useRouter();
  const [selectedStat, setSelectedStat] = React.useState<
    "CT" | "T" | undefined
  >(undefined);

  const handleMapSelect = (
    matchId: number,
    matchGameId?: number | undefined
  ) => {
    // Generate the new URL based on the selected matchGameId
    const newUrl =
      matchGameId && matchId
        ? `/matches/${matchId}/games/${matchGameId}`
        : `/matches/${matchId}`;

    // Use router.push or router.replace to navigate without reloading the page
    router.push(newUrl, { scroll: false });
  };

  const { teamStats } = useGameTeamStats(matchGameId);
  const { playerStats } = useGamePlayerStats(matchGameId, selectedStat);
  const { topPlayers } = useGameTopPlayers(matchGameId);
  const { roundInfo } = useGameRoundInfo(matchGameId);
  const { clip } = useGameClip(matchGameId);

  const baseFilter = {
    seasons: matchInfo.season_id.toString(),
    leagues: matchInfo.league_id.toString()
  };

  return (
    <div className="space-y-4 sm:space-y-10 p-1 sm:p-3">
      <MatchMapPicks
        matchId={matchId}
        handleMapSelect={handleMapSelect}
        externalMatchRoomId={externalMatchRoomId}
      />

      <MatchMapsHeader
        matchId={matchId}
        matchGameId={matchGameId}
        platform={platform}
        externalMatchRoomUrl={externalMatchRoomUrl}
        handleMapSelect={handleMapSelect}
      />

      {teamStats && teamStats.length > 0 && (
        <TeamStatistics
          teamStats={teamStats}
          teamStatsFilters={baseFilter}
          matchGameId={matchGameId}
          clip={clip}
        />
      )}

      {roundInfo && roundInfo.length > 0 && <RoundInfo roundInfo={roundInfo} />}

      {/* 2D Viewer */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">2D REPLAY VIEWER</h2>
        <div className="border rounded-lg p-4">
          <Viewer
            demoData={{
              map: "de_dust2",
              tickRate: 64,
              ticks: [],
              events: [],
              rounds: [],
              mapData: {
                offset: { x: -2476, y: 3239 },
                resolution: 0.0625,
                width: 1024,
                height: 1024
              }
            }}
          />
        </div>
      </div>

      {playerStats && playerStats.length > 0 && (
        <PlayerStatisticsForTeam
          playerStats={playerStats}
          teams={matchInfo.teams}
          playerStatsFilters={baseFilter}
          selectedStat={selectedStat}
          onStatChange={setSelectedStat}
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
