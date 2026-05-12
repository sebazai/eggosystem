"use client";

import { useState } from "react";
import { cn, mapToReadableName } from "@/lib/utils";
import Image from "next/image";
import type {
  TeamMapStats,
  TeamPistolWinStat,
  TeamPlantStat,
  TeamRetakeStats,
  TeamTradeMapStats
} from "@eggosystem/types";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import { BarChart3, Bomb, ArrowLeftRight, Crosshair } from "lucide-react";

type StatCategory = "general" | "plant" | "trade" | "openings";

interface TeamMapStatCardProps {
  mapStat: TeamMapStats;
  pistolStat?: TeamPistolWinStat;
  plantStat?: TeamPlantStat;
  retakeStat?: TeamRetakeStats;
  tradeStat?: TeamTradeMapStats;
}

const CATEGORY_TABS: {
  key: StatCategory;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "general",
    label: "General",
    shortLabel: "General",
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    key: "plant",
    label: "Plant & Retake",
    shortLabel: "Plant",
    icon: <Bomb className="w-4 h-4" />
  },
  {
    key: "trade",
    label: "Trading",
    shortLabel: "Trade",
    icon: <ArrowLeftRight className="w-4 h-4" />
  },
  {
    key: "openings",
    label: "Openings & Advantage",
    shortLabel: "Openings",
    icon: <Crosshair className="w-4 h-4" />
  }
];

// Function to determine color based on win percentage
const getWinRateColor = (winPercentage: number) => {
  if (winPercentage <= 25) return "text-red-400/50";
  if (winPercentage <= 50) return "text-amber-400/50";
  return "text-green-400/50";
};

// Function to determine color for progress bars
const getPistolRoundColor = (winPercentage: number) => {
  if (winPercentage <= 25) return "bg-red-400/50";
  if (winPercentage <= 50) return "bg-amber-400/50";
  return "bg-emerald-400/50";
};

export function TeamMapStatCard({
  mapStat,
  pistolStat,
  plantStat,
  retakeStat,
  tradeStat
}: TeamMapStatCardProps) {
  const [activeCategory, setActiveCategory] = useState<StatCategory>("general");
  const mapName = mapToReadableName(mapStat.map_name);

  const ctKd = mapStat.ct_kd;
  const tKd = mapStat.t_kd;

  return (
    <TooltipProvider>
      <div className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        {/* Map Header with Image */}
        <div className="relative h-48 w-full">
          <Image
            src={`/images/maps/${mapStat.map_name}.png`}
            alt={mapName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-4 text-white w-full">
              <h3 className="font-bold text-lg">{mapName}</h3>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Hero Stats Section */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <p
                className={`text-3xl font-bold ${getWinRateColor(mapStat.win_percentage)}`}
              >
                {mapStat.win_percentage.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Win rate</p>
            </div>
            <div className="text-center">
              <p className="text-xl">
                <span className="text-green-400/50 font-medium">
                  {mapStat.wins}
                </span>{" "}
                / {mapStat.maps_played}
              </p>
              <p className="text-xs text-muted-foreground">Wins / Played</p>
            </div>
            {pistolStat && (
              <div className="text-center">
                <p
                  className={`text-3xl font-bold ${getWinRateColor(pistolStat.pistol_win_percentage)}`}
                >
                  {pistolStat.pistol_win_percentage.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Pistol win</p>
              </div>
            )}
          </div>

          {/* Category Icon Tabs */}
          <div className="flex justify-between mb-4 border-b border-border">
            {CATEGORY_TABS.map((tab) => (
              <Tooltip key={tab.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveCategory(tab.key)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                      activeCategory === tab.key
                        ? "text-kanaliiga-orange border-b-2 border-kanaliiga-orange -mb-[1px]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.icon}
                    <span className="text-[10px] sm:text-xs">
                      {tab.shortLabel}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tab.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Category Content */}
          <div className="min-h-[200px]">
            {activeCategory === "general" && (
              <GeneralStats
                mapStat={mapStat}
                pistolStat={pistolStat}
                tKd={tKd}
                ctKd={ctKd}
              />
            )}
            {activeCategory === "plant" && (
              <PlantStats plantStat={plantStat} retakeStat={retakeStat} />
            )}
            {activeCategory === "trade" && <TradeStats tradeStat={tradeStat} />}
            {activeCategory === "openings" && (
              <OpeningsStats mapStat={mapStat} />
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// General Stats Component
function GeneralStats({
  mapStat,
  pistolStat,
  tKd,
  ctKd
}: {
  mapStat: TeamMapStats;
  pistolStat?: TeamPistolWinStat;
  tKd: number;
  ctKd: number;
}) {
  return (
    <div className="space-y-3">
      {/* Average Score */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Average score</span>
          <span className="font-medium">
            {mapStat.avg_score} - {mapStat.avg_opponent_score}
          </span>
        </div>
      </div>

      {/* Side stats */}
      <div className="space-y-2">
        {/* T side stats */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">K/D on T side</span>
            <span>{tKd.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-300/50"
              style={{
                width: `${Math.min(100, tKd * 50)}%`
              }}
            />
          </div>
        </div>

        {/* CT side stats */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">K/D on CT side</span>
            <span>{ctKd.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400/50"
              style={{
                width: `${Math.min(100, ctKd * 50)}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Pistol stats */}
      {pistolStat && (
        <div className="border-t border-border pt-3">
          <h4 className="text-sm font-medium mb-2 text-kanaliiga-orange">
            PISTOLS
          </h4>
          {/* Overall pistol rounds */}
          <div className="flex justify-between text-xs mb-1">
            <span>Pistol rounds</span>
            <span className="font-medium">
              {pistolStat.pistol_rounds_won} / {pistolStat.pistol_rounds_played}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getPistolRoundColor(pistolStat.pistol_win_percentage)}`}
              style={{ width: `${pistolStat.pistol_win_percentage}%` }}
            />
          </div>

          {/* T-side pistol rounds */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>T-side pistols</span>
              <span className="font-medium">
                {pistolStat.t_pistol_rounds_won} /{" "}
                {pistolStat.t_pistol_rounds_played}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-300/50"
                style={{
                  width: `${
                    pistolStat.t_pistol_rounds_played > 0
                      ? (pistolStat.t_pistol_rounds_won /
                          pistolStat.t_pistol_rounds_played) *
                        100
                      : 0
                  }%`
                }}
              />
            </div>
          </div>

          {/* CT-side pistol rounds */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>CT-side pistols</span>
              <span className="font-medium">
                {pistolStat.ct_pistol_rounds_won} /{" "}
                {pistolStat.ct_pistol_rounds_played}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400/50"
                style={{
                  width: `${
                    pistolStat.ct_pistol_rounds_played > 0
                      ? (pistolStat.ct_pistol_rounds_won /
                          pistolStat.ct_pistol_rounds_played) *
                        100
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Plant Stats Component
function PlantStats({
  plantStat,
  retakeStat
}: {
  plantStat?: TeamPlantStat;
  retakeStat?: TeamRetakeStats;
}) {
  if (!plantStat && !retakeStat) {
    return (
      <p className="text-xs text-muted-foreground">No plant data available</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Legend header - A and B */}
      <div className="grid grid-cols-3 text-center text-xs mb-1">
        <div className="font-bold text-lg py-1">A</div>
        <div></div>
        <div className="font-bold text-lg py-1">B</div>
      </div>

      {/* Plant stats */}
      {plantStat && (
        <>
          {/* Bomb plants (T) */}
          <div>
            <div className="grid grid-cols-3 text-xs mb-0.5 leading-tight">
              <div className="text-left">Bomb plants (T)</div>
              <div className="text-center">No plant</div>
              <div className="text-right font-medium">
                {plantStat.planted_a_site + plantStat.planted_b_site} /{" "}
                {plantStat.planted_a_site +
                  plantStat.planted_b_site +
                  plantStat.no_plants}
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
              {(() => {
                const total =
                  plantStat.planted_a_site +
                  plantStat.planted_b_site +
                  plantStat.no_plants;
                if (total === 0) return null;
                const aPerc = (plantStat.planted_a_site / total) * 100;
                const bPerc = (plantStat.planted_b_site / total) * 100;
                const noPerc = (plantStat.no_plants / total) * 100;
                return (
                  <>
                    <div
                      className="h-full bg-amber-300/50"
                      style={{ width: `${aPerc}%` }}
                    />
                    <div
                      className="h-full bg-gray-800/50"
                      style={{ width: `${noPerc}%` }}
                    />
                    <div
                      className="h-full bg-amber-300/50"
                      style={{ width: `${bPerc}%` }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-3 text-center text-xs">
              <div className="font-medium text-amber-300/70">
                {plantStat.planted_a_site}
              </div>
              <div className="font-medium text-gray-400/70">
                {plantStat.no_plants}
              </div>
              <div className="font-medium text-amber-300/70">
                {plantStat.planted_b_site}
              </div>
            </div>
          </div>

          {/* Enemy plants (CT) */}
          <div>
            <div className="grid grid-cols-3 text-xs mb-0.5 leading-tight">
              <div className="text-left">Enemy plants (CT)</div>
              <div className="text-center">No plant</div>
              <div className="text-right font-medium">
                {plantStat.enemy_planted_a_site +
                  plantStat.enemy_planted_b_site}{" "}
                /{" "}
                {plantStat.enemy_planted_a_site +
                  plantStat.enemy_planted_b_site +
                  plantStat.enemy_no_plants}
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
              {(() => {
                const total =
                  plantStat.enemy_planted_a_site +
                  plantStat.enemy_planted_b_site +
                  plantStat.enemy_no_plants;
                if (total === 0) return null;
                const aPerc = (plantStat.enemy_planted_a_site / total) * 100;
                const bPerc = (plantStat.enemy_planted_b_site / total) * 100;
                const noPerc = (plantStat.enemy_no_plants / total) * 100;
                return (
                  <>
                    <div
                      className="h-full bg-sky-400/50"
                      style={{ width: `${aPerc}%` }}
                    />
                    <div
                      className="h-full bg-gray-800/50"
                      style={{ width: `${noPerc}%` }}
                    />
                    <div
                      className="h-full bg-sky-400/50"
                      style={{ width: `${bPerc}%` }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-3 text-center text-xs">
              <div className="font-medium text-sky-400/70">
                {plantStat.enemy_planted_a_site}
              </div>
              <div className="font-medium text-gray-400/70">
                {plantStat.enemy_no_plants}
              </div>
              <div className="font-medium text-sky-400/70">
                {plantStat.enemy_planted_b_site}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Afterplant and Retake stats */}
      {retakeStat && (
        <>
          {/* Afterplants (T) */}
          <div>
            <div className="grid grid-cols-3 text-xs mb-0.5 leading-tight">
              <div className="text-left">Afterplants (T)</div>
              <div className="text-center">Lost</div>
              <div className="text-right font-medium">
                {retakeStat.afterplant_won} / {retakeStat.afterplant_total}
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
              {(() => {
                const total = retakeStat.afterplant_total || 1;
                const aPerc = (retakeStat.afterplant_a_won / total) * 100;
                const bPerc = (retakeStat.afterplant_b_won / total) * 100;
                const lostPerc = 100 - aPerc - bPerc;
                return (
                  <>
                    <div
                      className="h-full bg-amber-300/50"
                      style={{ width: `${aPerc}%` }}
                    />
                    <div
                      className="h-full bg-gray-800/50"
                      style={{ width: `${lostPerc}%` }}
                    />
                    <div
                      className="h-full bg-amber-300/50"
                      style={{ width: `${bPerc}%` }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-3 text-center text-xs">
              <div className="font-medium text-amber-300/70">
                {retakeStat.afterplant_a_won} / {retakeStat.afterplant_a_total}
              </div>
              <div className="font-medium text-gray-400/70">
                {retakeStat.afterplant_total - retakeStat.afterplant_won}
              </div>
              <div className="font-medium text-amber-300/70">
                {retakeStat.afterplant_b_won} / {retakeStat.afterplant_b_total}
              </div>
            </div>
          </div>

          {/* Retakes (CT) */}
          <div>
            <div className="grid grid-cols-3 text-xs mb-0.5 leading-tight">
              <div className="text-left">Retakes (CT)</div>
              <div className="text-center">Lost</div>
              <div className="text-right font-medium">
                {retakeStat.retake_won} / {retakeStat.retake_total}
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
              {(() => {
                const total = retakeStat.retake_total || 1;
                const aPerc = (retakeStat.retake_a_won / total) * 100;
                const bPerc = (retakeStat.retake_b_won / total) * 100;
                const lostPerc = 100 - aPerc - bPerc;
                return (
                  <>
                    <div
                      className="h-full bg-sky-400/50"
                      style={{ width: `${aPerc}%` }}
                    />
                    <div
                      className="h-full bg-gray-800/50"
                      style={{ width: `${lostPerc}%` }}
                    />
                    <div
                      className="h-full bg-sky-400/50"
                      style={{ width: `${bPerc}%` }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-3 text-center text-xs">
              <div className="font-medium text-sky-400/70">
                {retakeStat.retake_a_won} / {retakeStat.retake_a_total}
              </div>
              <div className="font-medium text-gray-400/70">
                {retakeStat.retake_total - retakeStat.retake_won}
              </div>
              <div className="font-medium text-sky-400/70">
                {retakeStat.retake_b_won} / {retakeStat.retake_b_total}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Summary Section */}
      {retakeStat && (
        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-border">
          <div>
            <p className="text-lg font-bold">
              {retakeStat.afterplant_total > 0
                ? (
                    (retakeStat.afterplant_won / retakeStat.afterplant_total) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground">Afterplant Win %</p>
          </div>
          <div>
            <p className="text-lg font-bold">
              {retakeStat.retake_total > 0
                ? (
                    (retakeStat.retake_won / retakeStat.retake_total) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground">Retake Win %</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Trade Stats Component
function TradeStats({ tradeStat }: { tradeStat?: TeamTradeMapStats }) {
  if (!tradeStat) {
    return (
      <p className="text-xs text-muted-foreground">No trade data available</p>
    );
  }

  const { trades, trade_attempts, trade_opportunities } = tradeStat;
  const failedAttempts = trade_attempts - trades;
  const ignoredOpportunities = trade_opportunities - trade_attempts;
  const total = trade_opportunities || 1;

  const attemptRate =
    trade_opportunities > 0 ? (trade_attempts / trade_opportunities) * 100 : 0;
  const conversionRate =
    trade_attempts > 0 ? (trades / trade_attempts) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Stacked bar: Success (green) + Failed (amber) + Ignored (red) */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-green-400">Success ({trades})</span>
          <span className="text-amber-400">Failed ({failedAttempts})</span>
          <span className="text-red-400">Ignored ({ignoredOpportunities})</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
          {/* Green: successful trades */}
          {trades > 0 && (
            <div
              className="h-full bg-green-400/50"
              style={{ width: `${(trades / total) * 100}%` }}
            />
          )}
          {/* Amber: tried but failed */}
          {failedAttempts > 0 && (
            <div
              className="h-full bg-amber-400/50"
              style={{ width: `${(failedAttempts / total) * 100}%` }}
            />
          )}
          {/* Red: didn't try */}
          {ignoredOpportunities > 0 && (
            <div
              className="h-full bg-red-400/50"
              style={{ width: `${(ignoredOpportunities / total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Attempt Rate */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">Attempt Rate</span>
          <span className="font-bold">{attemptRate.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${attemptRate >= 80 ? "bg-green-400/50" : attemptRate >= 60 ? "bg-amber-400/50" : "bg-red-400/50"}`}
            style={{ width: `${attemptRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tried {trade_attempts} / {trade_opportunities} opportunities
        </p>
      </div>

      {/* Conversion Rate */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">Conversion Rate</span>
          <span className="font-bold">{conversionRate.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${conversionRate >= 70 ? "bg-green-400/50" : conversionRate >= 50 ? "bg-amber-400/50" : "bg-red-400/50"}`}
            style={{ width: `${conversionRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Got {trades} / {trade_attempts} attempts
        </p>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
        <div>
          <p className="text-lg font-bold">{trade_opportunities}</p>
          <p className="text-xs text-muted-foreground">Opportunities</p>
        </div>
        <div>
          <p className="text-lg font-bold">{trade_attempts}</p>
          <p className="text-xs text-muted-foreground">Attempted</p>
        </div>
        <div>
          <p className="text-lg font-bold">{trades}</p>
          <p className="text-xs text-muted-foreground">Success</p>
        </div>
      </div>
    </div>
  );
}

// Openings Stats Component
function OpeningsStats({ mapStat }: { mapStat: TeamMapStats }) {
  const totalOpenings = mapStat.first_kills + mapStat.first_deaths;
  const openingWinRate =
    totalOpenings > 0 ? (mapStat.first_kills / totalOpenings) * 100 : 50;

  const totalOpeningsT = mapStat.first_kills_t + mapStat.first_deaths_t;
  const openingWinRateT =
    totalOpeningsT > 0 ? (mapStat.first_kills_t / totalOpeningsT) * 100 : 50;

  const totalOpeningsCT = mapStat.first_kills_ct + mapStat.first_deaths_ct;
  const openingWinRateCT =
    totalOpeningsCT > 0 ? (mapStat.first_kills_ct / totalOpeningsCT) * 100 : 50;

  // 5v4 / 4v5 stats (overall)
  const fk5v4WinRate =
    mapStat.fk_5v4_total > 0
      ? (mapStat.fk_5v4_won / mapStat.fk_5v4_total) * 100
      : 0;
  const fk4v5WinRate =
    mapStat.fk_4v5_total > 0
      ? (mapStat.fk_4v5_won / mapStat.fk_4v5_total) * 100
      : 0;

  // 5v4 / 4v5 stats (CT side)
  const fk5v4WinRateCT =
    mapStat.fk_5v4_total_ct > 0
      ? (mapStat.fk_5v4_won_ct / mapStat.fk_5v4_total_ct) * 100
      : 0;
  const fk4v5WinRateCT =
    mapStat.fk_4v5_total_ct > 0
      ? (mapStat.fk_4v5_won_ct / mapStat.fk_4v5_total_ct) * 100
      : 0;

  // 5v4 / 4v5 stats (T side)
  const fk5v4WinRateT =
    mapStat.fk_5v4_total_t > 0
      ? (mapStat.fk_5v4_won_t / mapStat.fk_5v4_total_t) * 100
      : 0;
  const fk4v5WinRateT =
    mapStat.fk_4v5_total_t > 0
      ? (mapStat.fk_4v5_won_t / mapStat.fk_4v5_total_t) * 100
      : 0;

  return (
    <div className="space-y-3">
      {/* Opening Win Rate */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Opening Win Rate</span>
          <span className="font-medium">{openingWinRate.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${openingWinRate >= 50 ? "bg-emerald-400/50" : "bg-red-400/50"}`}
            style={{ width: `${openingWinRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {mapStat.first_kills} first kills / {mapStat.first_deaths} first
          deaths
        </p>
      </div>

      {/* T/CT Side Openings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>T-side</span>
            <span className="font-medium">{openingWinRateT.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-300/50"
              style={{ width: `${openingWinRateT}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>CT-side</span>
            <span className="font-medium">{openingWinRateCT.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400/50"
              style={{ width: `${openingWinRateCT}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5v4 / 4v5 Advantage Stats */}
      <div className="border-t border-border pt-3">
        <h4 className="text-sm font-medium mb-2 text-kanaliiga-orange">
          ADVANTAGE ROUNDS
        </h4>
        {/* 5v4 / 4v5 by Side - Side by side layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* 5v4 by Side - Left column */}
          <div>
            <h5 className="text-xs font-medium mb-1.5 text-muted-foreground">
              5v4 by Side
            </h5>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>T-side</span>
                  <span className="font-medium">
                    {fk5v4WinRateT.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400/50"
                    style={{ width: `${fk5v4WinRateT}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mapStat.fk_5v4_won_t} / {mapStat.fk_5v4_total_t}
                </p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>CT-side</span>
                  <span className="font-medium">
                    {fk5v4WinRateCT.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400/50"
                    style={{ width: `${fk5v4WinRateCT}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mapStat.fk_5v4_won_ct} / {mapStat.fk_5v4_total_ct}
                </p>
              </div>
            </div>
          </div>

          {/* 4v5 by Side - Right column */}
          <div>
            <h5 className="text-xs font-medium mb-1.5 text-muted-foreground">
              4v5 by Side
            </h5>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>T-side</span>
                  <span className="font-medium">
                    {fk4v5WinRateT.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400/50"
                    style={{ width: `${fk4v5WinRateT}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mapStat.fk_4v5_won_t} / {mapStat.fk_4v5_total_t}
                </p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>CT-side</span>
                  <span className="font-medium">
                    {fk4v5WinRateCT.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400/50"
                    style={{ width: `${fk4v5WinRateCT}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mapStat.fk_4v5_won_ct} / {mapStat.fk_4v5_total_ct}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-border mt-3">
          <div>
            <p className="text-lg font-bold">{fk5v4WinRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">5v4 Win Rate</p>
          </div>
          <div>
            <p className="text-lg font-bold">{fk4v5WinRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">4v5 Win Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
