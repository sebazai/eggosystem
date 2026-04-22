"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/loading";
import { AfterplantTab } from "./AfterplantTab";
import { OpeningDuelsTab } from "./OpeningDuelsTab";
import { KillMatrixTab } from "./KillMatrixTab";
import { TradeTab } from "./TradeTab";
import { useMatchGameAfterplantAnalysis } from "@/hooks/data/useMatchGameAfterplantAnalysis";
import { useMatchGameOpeningDuels } from "@/hooks/data/useMatchGameOpeningDuels";
import { useMatchGameKillMatrix } from "@/hooks/data/useMatchGameKillMatrix";
import { useMatchGameTradeStats } from "@/hooks/data/useMatchGameTradeStats";
import { useGamePlayerStats } from "@/hooks/data/useGamePlayerStats";
import type { MatchInfo } from "@eggosystem/types";

interface MatchGameAnalysisProps {
  matchGameId: number;
  matchInfo: MatchInfo;
}

const VALID_TABS = [
  "afterplant",
  "opening-duels",
  "kill-matrix",
  "trades"
] as const;
type TabValue = (typeof VALID_TABS)[number];

export const MatchGameAnalysis = ({
  matchGameId,
  matchInfo
}: MatchGameAnalysisProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "";
  const activeTab: TabValue = (VALID_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as TabValue)
    : "afterplant";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const { afterplantRounds, isLoading: isLoadingAfterplant } =
    useMatchGameAfterplantAnalysis(matchGameId);

  const { openingDuels, isLoading: isLoadingDuels } =
    useMatchGameOpeningDuels(matchGameId);

  const { killMatrix, isLoading: isLoadingMatrix } =
    useMatchGameKillMatrix(matchGameId);

  const { tradeStats, isLoading: isLoadingTrades } =
    useMatchGameTradeStats(matchGameId);

  const { playerStats, isLoading: isLoadingPlayers } =
    useGamePlayerStats(matchGameId);

  const isLoading =
    isLoadingAfterplant ||
    isLoadingPlayers ||
    isLoadingDuels ||
    isLoadingMatrix ||
    isLoadingTrades;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-4 grid grid-cols-2 sm:flex w-full h-auto sm:h-9 items-stretch sm:items-center">
        <TabsTrigger
          value="afterplant"
          className="h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Afterplants &amp; Retakes
        </TabsTrigger>
        <TabsTrigger
          value="opening-duels"
          className="h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Opening Duels
        </TabsTrigger>
        <TabsTrigger
          value="kill-matrix"
          className="h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Kill &amp; Flash Matrix
        </TabsTrigger>
        <TabsTrigger
          value="trades"
          className="h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Trades
        </TabsTrigger>
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

      <TabsContent value="trades">
        {isLoading && <TableSkeleton rows={6} />}
        {!isLoading && tradeStats && (
          <TradeTab tradeStats={tradeStats} teams={matchInfo.teams} />
        )}
      </TabsContent>
    </Tabs>
  );
};
