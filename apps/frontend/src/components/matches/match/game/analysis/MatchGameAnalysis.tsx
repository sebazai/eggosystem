"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/loading";
import { AfterplantTab } from "./AfterplantTab";
import { OpeningDuelsTab } from "./OpeningDuelsTab";
import { KillMatrixTab } from "./KillMatrixTab";
import { TradeTab } from "./TradeTab";
import { InsightsTab } from "./InsightsTab";
import { RoundSwingTab } from "./RoundSwingTab";
import { SupportUtilityTab } from "./SupportUtilityTab";
import { useMatchGameAfterplantAnalysis } from "@/hooks/data/useMatchGameAfterplantAnalysis";
import { useMatchGameOpeningDuels } from "@/hooks/data/useMatchGameOpeningDuels";
import { useMatchGameTradeStats } from "@/hooks/data/useMatchGameTradeStats";
import { useMatchGameInsights } from "@/hooks/data/useMatchGameInsights";
import { useGamePlayerStats } from "@/hooks/data/useGamePlayerStats";
import type { MatchInfo } from "@eggosystem/types";

interface MatchGameAnalysisProps {
  matchGameId: number;
  matchInfo: MatchInfo;
}

const VALID_TABS = [
  "insights",
  "afterplant",
  "opening-duels",
  "kill-matrix",
  "trades",
  "round-swings",
  "support-utility"
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
    : "insights";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const { afterplantRounds, isLoading: isLoadingAfterplant } =
    useMatchGameAfterplantAnalysis(matchGameId);

  const { openingDuels, isLoading: isLoadingDuels } =
    useMatchGameOpeningDuels(matchGameId);

  const { tradeStats, isLoading: isLoadingTrades } =
    useMatchGameTradeStats(matchGameId);

  const { insights, isLoading: isLoadingInsights } =
    useMatchGameInsights(matchGameId);

  const { playerStats, isLoading: isLoadingPlayers } =
    useGamePlayerStats(matchGameId);

  const isLoadingLegacy =
    isLoadingAfterplant ||
    isLoadingPlayers ||
    isLoadingDuels ||
    isLoadingTrades;

  // Build a steam_id → nickname map from playerStats for the insights tab
  const playerNames = useMemo(() => {
    const map = new Map<string, string>();
    if (!playerStats) return map;
    for (const p of playerStats) {
      map.set(String(p.steam_id), p.nickname);
    }
    return map;
  }, [playerStats]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-4 grid grid-cols-2 sm:flex w-full h-auto sm:h-9 items-stretch sm:items-center">
        <TabsTrigger
          value="insights"
          className="h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Insights
        </TabsTrigger>
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
          className="col-span-2 sm:col-span-1 h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Trades
        </TabsTrigger>
        <TabsTrigger
          value="round-swings"
          className="col-span-2 sm:col-span-1 h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Round Swings
        </TabsTrigger>
        <TabsTrigger
          value="support-utility"
          className="col-span-2 sm:col-span-1 h-auto sm:h-full py-2 whitespace-normal sm:whitespace-nowrap text-center text-xs sm:text-sm"
        >
          Support &amp; Utility
        </TabsTrigger>
      </TabsList>

      <TabsContent value="insights">
        {(isLoadingInsights || isLoadingPlayers) && <TableSkeleton rows={6} />}
        {!isLoadingInsights && !isLoadingPlayers && insights && (
          <InsightsTab
            insights={insights}
            playerNames={playerNames}
            matchTeams={matchInfo.teams}
          />
        )}
      </TabsContent>

      <TabsContent value="afterplant">
        {isLoadingLegacy && <TableSkeleton rows={6} />}
        {!isLoadingLegacy && afterplantRounds && playerStats && (
          <AfterplantTab
            afterplantRounds={afterplantRounds}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>

      <TabsContent value="opening-duels">
        {isLoadingLegacy && <TableSkeleton rows={6} />}
        {!isLoadingLegacy && openingDuels && playerStats && (
          <OpeningDuelsTab
            duels={openingDuels}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>

      <TabsContent value="kill-matrix">
        {isLoadingLegacy && <TableSkeleton rows={6} />}
        {!isLoadingLegacy && playerStats && (
          <KillMatrixTab
            matchGameId={matchGameId}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>

      <TabsContent value="trades">
        {isLoadingLegacy && <TableSkeleton rows={6} />}
        {!isLoadingLegacy && tradeStats && (
          <TradeTab tradeStats={tradeStats} teams={matchInfo.teams} />
        )}
      </TabsContent>

      <TabsContent value="round-swings">
        <RoundSwingTab
          matchGameId={matchGameId}
          playerNames={playerNames}
          teams={matchInfo.teams}
        />
      </TabsContent>

      <TabsContent value="support-utility">
        {isLoadingPlayers && <TableSkeleton rows={6} />}
        {!isLoadingPlayers && playerStats && (
          <SupportUtilityTab
            matchGameId={matchGameId}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
