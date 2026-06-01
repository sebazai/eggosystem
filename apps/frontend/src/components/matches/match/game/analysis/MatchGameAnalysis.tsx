"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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

const TAB_LABELS: Record<TabValue, string> = {
  insights: "Overview",
  afterplant: "Afterplants",
  "opening-duels": "Opening Duels",
  "kill-matrix": "Kill Matrix",
  trades: "Trades",
  "round-swings": "Round Swings",
  "support-utility": "Support & Utility"
};

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
      {/* Mobile: shadcn select */}
      <div className="mb-4 min-[773px]:hidden">
        <Select value={activeTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full rounded-xl border-border/50 bg-card/80 text-xs font-headings focus:ring-1 focus:ring-kanaliiga-orange">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VALID_TABS.map((tab) => (
              <SelectItem
                key={tab}
                value={tab}
                className="text-xs font-headings"
              >
                {TAB_LABELS[tab]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: horizontal tab bar */}
      <div className="mb-4 hidden min-[773px]:block">
        <TabsList className="inline-flex h-auto min-w-full w-max gap-0 bg-card/80 border border-border/50 p-0.5 rounded-xl">
          {VALID_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="shrink-0 px-3 py-2 text-xs whitespace-nowrap rounded-lg font-headings data-[state=active]:bg-background data-[state=active]:text-kanaliiga-orange data-[state=active]:shadow-sm"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="insights">
        {(isLoadingInsights || isLoadingPlayers || isLoadingDuels) && (
          <TableSkeleton rows={6} />
        )}
        {!isLoadingInsights &&
          !isLoadingPlayers &&
          !isLoadingDuels &&
          insights && (
            <InsightsTab
              matchGameId={matchGameId}
              insights={insights}
              playerNames={playerNames}
              playerStats={playerStats ?? []}
              openingDuels={openingDuels ?? []}
              matchTeams={matchInfo.teams}
            />
          )}
      </TabsContent>

      <TabsContent value="afterplant">
        {(isLoadingAfterplant || isLoadingPlayers) && (
          <TableSkeleton rows={6} />
        )}
        {!isLoadingAfterplant &&
          !isLoadingPlayers &&
          afterplantRounds &&
          playerStats && (
            <AfterplantTab
              afterplantRounds={afterplantRounds}
              playerStats={playerStats}
              teams={matchInfo.teams}
            />
          )}
      </TabsContent>

      <TabsContent value="opening-duels">
        {(isLoadingPlayers || isLoadingDuels) && <TableSkeleton rows={6} />}
        {!isLoadingPlayers &&
          !isLoadingDuels &&
          openingDuels &&
          playerStats && (
            <OpeningDuelsTab
              matchGameId={matchGameId}
              duels={openingDuels}
              playerStats={playerStats}
              teams={matchInfo.teams}
            />
          )}
      </TabsContent>

      <TabsContent value="kill-matrix">
        {isLoadingPlayers && <TableSkeleton rows={6} />}
        {!isLoadingPlayers && playerStats && (
          <KillMatrixTab
            matchGameId={matchGameId}
            playerStats={playerStats}
            teams={matchInfo.teams}
          />
        )}
      </TabsContent>

      <TabsContent value="trades">
        {isLoadingTrades && <TableSkeleton rows={6} />}
        {!isLoadingTrades && tradeStats && (
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
