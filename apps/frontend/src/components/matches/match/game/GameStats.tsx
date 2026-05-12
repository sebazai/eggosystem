"use client";

import React, { useState } from "react";

import { useRouter } from "next/navigation";
import type { MatchInfo, SeasonPlatform } from "@eggosystem/types";
import { useGamePlayerStats } from "@/hooks/data/useGamePlayerStats";
import { MatchMapPicks } from "../stats/MapPicks";
import { TeamStatistics } from "../stats/TeamStatistics";
import { RoundInfo } from "../stats/RoundRows";
import { TwoDViewer } from "../stats/TwoDViewer";
import { PlayerStatisticsForTeam } from "../stats/PlayerStatisticsForTeam";
import { TopPlayers } from "../stats/TopPlayers";
import { useGameTopPlayers } from "@/hooks/data/useGameTopPlayers";
import _ from "lodash";
import { MatchMapsHeader } from "../stats/MatchMapsHeader";
import { useGameClip } from "@/hooks/data/useGameClip";
import { PlayerStatisticsSkeleton } from "@/components/loading";
import { TopPlayersSkeleton } from "@/components/loading";

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
  const [is2DViewerOpen, setIs2DViewerOpen] = useState(false);
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

  const { playerStats, isLoading: isLoadingPlayerStats } = useGamePlayerStats(
    matchGameId,
    selectedStat
  );
  const { topPlayers, isLoading: isLoadingTopPlayers } =
    useGameTopPlayers(matchGameId);
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

      <TeamStatistics
        teamStatsFilters={baseFilter}
        matchGameId={matchGameId}
        clip={clip}
        matchTeams={matchInfo.teams}
      />

      <RoundInfo
        matchGameId={matchGameId}
        setIs2DViewerOpen={setIs2DViewerOpen}
      />

      <TwoDViewer
        matchGameId={matchGameId}
        isModalOpen={is2DViewerOpen}
        setIsModalOpen={setIs2DViewerOpen}
      />

      {isLoadingPlayerStats && <PlayerStatisticsSkeleton />}
      {!isLoadingPlayerStats && playerStats && playerStats.length > 0 && (
        <PlayerStatisticsForTeam
          playerStats={playerStats}
          teams={matchInfo.teams}
          playerStatsFilters={baseFilter}
          selectedStat={selectedStat}
          onStatChange={setSelectedStat}
        />
      )}

      {isLoadingTopPlayers && <TopPlayersSkeleton />}
      {!isLoadingTopPlayers && topPlayers && !_.isEmpty(topPlayers) && (
        <TopPlayers
          topPlayers={topPlayers}
          teams={matchInfo.teams}
          topPlayerFilters={baseFilter}
        />
      )}
    </div>
  );
};
