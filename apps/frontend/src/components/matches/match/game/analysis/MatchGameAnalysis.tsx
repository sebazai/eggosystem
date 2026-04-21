"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/loading";
import { AfterplantTab } from "./AfterplantTab";
import { OpeningDuelsTab } from "./OpeningDuelsTab";
import { KillMatrixTab } from "./KillMatrixTab";
import { useMatchGameAfterplantAnalysis } from "@/hooks/data/useMatchGameAfterplantAnalysis";
import { useMatchGameOpeningDuels } from "@/hooks/data/useMatchGameOpeningDuels";
import { useMatchGameKillMatrix } from "@/hooks/data/useMatchGameKillMatrix";
import { useGamePlayerStats } from "@/hooks/data/useGamePlayerStats";
import type { MatchInfo } from "@eggosystem/types";

interface MatchGameAnalysisProps {
  matchGameId: number;
  matchInfo: MatchInfo;
}

export const MatchGameAnalysis = ({
  matchGameId,
  matchInfo
}: MatchGameAnalysisProps) => {
  const { afterplantRounds, isLoading: isLoadingAfterplant } =
    useMatchGameAfterplantAnalysis(matchGameId);

  const { openingDuels, isLoading: isLoadingDuels } =
    useMatchGameOpeningDuels(matchGameId);

  const { killMatrix, isLoading: isLoadingMatrix } =
    useMatchGameKillMatrix(matchGameId);

  const { playerStats, isLoading: isLoadingPlayers } =
    useGamePlayerStats(matchGameId);

  const isLoading =
    isLoadingAfterplant ||
    isLoadingPlayers ||
    isLoadingDuels ||
    isLoadingMatrix;

  return (
    <Tabs defaultValue="afterplant" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="afterplant">Afterplants &amp; Retakes</TabsTrigger>
        <TabsTrigger value="opening-duels">Opening Duels</TabsTrigger>
        <TabsTrigger value="kill-matrix">Kill &amp; Flash Matrix</TabsTrigger>
      </TabsList>

      <TabsContent value="afterplant">
        {isLoading && <TableSkeleton rows={6} />}
        {!isLoading && afterplantRounds && playerStats && (
          <AfterplantTab
            afterplantRounds={afterplantRounds}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>

      <TabsContent value="opening-duels">
        {isLoading && <TableSkeleton rows={6} />}
        {!isLoading && openingDuels && playerStats && (
          <OpeningDuelsTab
            duels={openingDuels}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>

      <TabsContent value="kill-matrix">
        {isLoading && <TableSkeleton rows={6} />}
        {!isLoading && killMatrix && playerStats && (
          <KillMatrixTab
            matrix={killMatrix}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
