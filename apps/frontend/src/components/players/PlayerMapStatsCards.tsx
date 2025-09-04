"use client";

import { useFilteredPlayerMapStats } from "@/hooks/data/filtered/useFilteredPlayerMapStats";
import { mapToReadableName } from "@/lib/utils";
import Image from "next/image";
import { Alert, AlertDescription } from "../ui/alert";
import { InfoIcon } from "lucide-react";
import { useFilters } from "@/context/FilterContext";

interface PlayerMapStatsCardsProps {
  steamId: string;
}

// Function to determine color based on win percentage
const getWinRateColor = (winPercentage: number) => {
  if (winPercentage <= 25) return "text-red-400/50";
  if (winPercentage <= 50) return "text-amber-400/50";
  return "text-green-400/50";
};

// Function to determine color based on kana rating
const getKanaRatingColor = (rating: number) => {
  if (rating < 0.5) return "bg-red-400/50";
  if (rating < 0.8) return "bg-amber-400/50";
  return "bg-green-400/50";
};

// Function to determine color based on ADR
const getAdrColor = (adr: number) => {
  if (adr < 50) return "bg-red-400/50";
  if (adr < 80) return "bg-amber-400/50";
  return "bg-green-400/50";
};

// Function to determine color based on counter-strafing percentage
const getCounterStrafingColor = (percentage: number) => {
  if (percentage < 65) return "bg-red-400/50";
  if (percentage < 80) return "bg-amber-400/50";
  return "bg-green-400/50";
};

// Function to determine color based on crosshair placement (angle)
const getCrosshairPlacementColor = (value: number) => {
  if (value <= 4) return "bg-green-400/50";
  if (value <= 8) return "bg-yellow-400/50";
  if (value <= 12) return "bg-orange-400/50";
  return "bg-red-400/50";
};

// Function to determine color based on headshot percentage
const getHeadshotColor = (percentage: number) => {
  if (percentage < 10) return "bg-red-400/50";
  if (percentage < 20) return "bg-orange-400/50";
  if (percentage < 40) return "bg-yellow-400/50";
  return "bg-green-400/50";
};

// Function to determine color based on time to damage
const getTtdColor = (ttd: number) => {
  if (ttd > 800) return "bg-red-400/50";
  if (ttd > 600) return "bg-amber-400/50";
  return "bg-green-400/50";
};

// Color function for trade statistics based on percentage ranges
const getTradeColor = (percentage: number) => {
  if (percentage >= 0 && percentage < 40) return "bg-red-500/50";
  if (percentage >= 40 && percentage < 70) return "bg-yellow-500/50";
  if (percentage >= 70 && percentage <= 100) return "bg-green-500/50";
  return "bg-gray-500/50"; // fallback
};

export const PlayerMapStatsCards = ({ steamId }: PlayerMapStatsCardsProps) => {
  const { filterParams } = useFilters();
  const { playerMapStats, isLoading } = useFilteredPlayerMapStats({
    steamId,
    filterQueryParams: filterParams
  });

  if (isLoading) {
    // Return skeleton loader
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-lg overflow-hidden shadow-md animate-pulse"
          >
            <div className="h-48 bg-gray-800"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-800 rounded mb-4 w-1/3"></div>
              <div className="flex justify-between mb-4">
                <div className="h-8 bg-gray-800 rounded w-1/4"></div>
                <div className="h-8 bg-gray-800 rounded w-1/4"></div>
              </div>
              <div className="h-4 bg-gray-800 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-800 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!playerMapStats || playerMapStats.length === 0) {
    return (
      <Alert className="bg-blue-500/10 border-blue-500/50">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          No map statistics available for this player. Try selecting different
          filters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {playerMapStats.map((mapStat) => {
        const mapName = mapToReadableName(mapStat.map_name);

        // Calculate CT and T side KD ratios using actual data
        const tKd =
          mapStat.kills_t > 0
            ? (mapStat.kills_t / (mapStat.deaths / 2)).toFixed(2)
            : "0.00";
        const ctKd =
          mapStat.kills_ct > 0
            ? (mapStat.kills_ct / (mapStat.deaths / 2)).toFixed(2)
            : "0.00";

        return (
          <div
            key={mapStat.map_id}
            className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
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
              {/* Win rate stats */}
              <div className="flex justify-between items-center mb-6">
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
                <div className="text-center">
                  <p className="text-xl font-bold">{mapStat.kd.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">K/D Ratio</p>
                </div>
              </div>

              {/* Kana Rating slider */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">Kana Rating</span>
                  <span>{mapStat.kana_rating.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getKanaRatingColor(mapStat.kana_rating)}`}
                    style={{
                      width: `${Math.min(100, mapStat.kana_rating * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Side stats with actual data */}
              <div className="mb-4 space-y-2">
                {/* T side stats */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">K/D on T side</span>
                    <span>{tKd}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-300/50"
                      style={{
                        width: `${Math.min(100, parseFloat(tKd) * 50)}%`
                      }}
                    />
                  </div>
                </div>

                {/* CT side stats */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">K/D on CT side</span>
                    <span>{ctKd}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400/50"
                      style={{
                        width: `${Math.min(100, parseFloat(ctKd) * 50)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional stats */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>ADR</span>
                  <span className="font-medium">{mapStat.adr.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getAdrColor(mapStat.adr)}`}
                    style={{ width: `${Math.min(100, mapStat.adr / 2)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-3">
                  <span>Total Kills/Deaths</span>
                  <span className="font-medium">
                    {mapStat.kills} / {mapStat.deaths}
                  </span>
                </div>
              </div>

              {/* Trade Statistics */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Trade Statistics
                </h4>

                {/* Trade Opportunities Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Trade Opportunities</span>
                    <span>{mapStat.trade_opportunities}</span>
                  </div>

                  {/* Legends on top */}
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-400">Trades</span>
                    <span className="text-red-400">Missed</span>
                    <span className="text-yellow-400">Attempted</span>
                  </div>

                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Green: successful trades */}
                    {mapStat.trades > 0 && (
                      <div
                        className="h-full bg-green-500/50 absolute left-0"
                        style={{
                          width: `${(mapStat.trades / mapStat.trade_opportunities) * 100}%`
                        }}
                      />
                    )}
                    {/* Red: missed opportunities (opportunities - attempts) */}
                    {mapStat.trade_opportunities > mapStat.trade_attempts && (
                      <div
                        className="h-full bg-red-500/50 absolute"
                        style={{
                          left: `${(mapStat.trades / mapStat.trade_opportunities) * 100}%`,
                          width: `${((mapStat.trade_opportunities - mapStat.trade_attempts) / mapStat.trade_opportunities) * 100}%`
                        }}
                      />
                    )}
                    {/* Yellow: attempted but failed trades (attempts - trades) */}
                    {mapStat.trade_attempts > mapStat.trades && (
                      <div
                        className="h-full bg-yellow-500/50 absolute"
                        style={{
                          left: `${((mapStat.trades + (mapStat.trade_opportunities - mapStat.trade_attempts)) / mapStat.trade_opportunities) * 100}%`,
                          width: `${((mapStat.trade_attempts - mapStat.trades) / mapStat.trade_opportunities) * 100}%`
                        }}
                      />
                    )}
                  </div>

                  {/* Numbers below */}
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-green-400">{mapStat.trades}</span>
                    <span className="text-red-400">
                      {mapStat.trade_opportunities - mapStat.trade_attempts}
                    </span>
                    <span className="text-yellow-400">
                      {mapStat.trade_attempts - mapStat.trades}
                    </span>
                  </div>
                </div>

                {/* Trades Tried Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Trades Tried</span>
                    <span>
                      {mapStat.trade_attempts} / {mapStat.trade_opportunities}(
                      {mapStat.trade_opportunities > 0
                        ? (
                            (mapStat.trade_attempts /
                              mapStat.trade_opportunities) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getTradeColor(mapStat.trade_opportunities > 0 ? (mapStat.trade_attempts / mapStat.trade_opportunities) * 100 : 0)}`}
                      style={{
                        width: `${mapStat.trade_opportunities > 0 ? (mapStat.trade_attempts / mapStat.trade_opportunities) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Successful Trades Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Successful Trades</span>
                    <span>
                      {mapStat.trades} / {mapStat.trade_attempts}(
                      {mapStat.trade_attempts > 0
                        ? (
                            (mapStat.trades / mapStat.trade_attempts) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getTradeColor(mapStat.trade_attempts > 0 ? (mapStat.trades / mapStat.trade_attempts) * 100 : 0)}`}
                      style={{
                        width: `${mapStat.trade_attempts > 0 ? (mapStat.trades / mapStat.trade_attempts) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Counter-strafing Statistics */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Aim & Movement
                </h4>

                {/* Counter-strafing */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Counter-strafing</span>
                    <span>
                      {mapStat.counter_strafing_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getCounterStrafingColor(mapStat.counter_strafing_percentage)}`}
                      style={{
                        width: `${Math.min(100, mapStat.counter_strafing_percentage)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Crosshair Placement */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Crosshair Placement</span>
                    <span>{mapStat.crosshair_placement.toFixed(1)}°</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getCrosshairPlacementColor(mapStat.crosshair_placement)}`}
                      style={{
                        width: `${Math.min(100, (mapStat.crosshair_placement / 15) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Headshot Percentage */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Headshot %</span>
                    <span>{mapStat.hs_percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getHeadshotColor(mapStat.hs_percent)}`}
                      style={{
                        width: `${Math.min(100, mapStat.hs_percent)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Time to Damage */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Time to Damage</span>
                    <span>{mapStat.time_to_damage.toFixed(0)}ms</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getTtdColor(mapStat.time_to_damage)}`}
                      style={{
                        width: `${Math.min(100, (mapStat.time_to_damage / 1000) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* First Kill/Death Statistics */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  First Kill/Death
                </h4>

                {/* Overall First Kills/Deaths */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">First Kills/Deaths</span>
                    <span>
                      {mapStat.first_kills} / {mapStat.first_deaths}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Green: first kills */}
                    {mapStat.first_kills > 0 && (
                      <div
                        className="h-full bg-green-500/50 absolute left-0"
                        style={{
                          width: `${(mapStat.first_kills / (mapStat.first_kills + mapStat.first_deaths)) * 100}%`
                        }}
                      />
                    )}
                    {/* Red: first deaths */}
                    {mapStat.first_deaths > 0 && (
                      <div
                        className="h-full bg-red-500/50 absolute"
                        style={{
                          left: `${(mapStat.first_kills / (mapStat.first_kills + mapStat.first_deaths)) * 100}%`,
                          width: `${(mapStat.first_deaths / (mapStat.first_kills + mapStat.first_deaths)) * 100}%`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* CT Side First Kills/Deaths */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">CT First Kills/Deaths</span>
                    <span>
                      {mapStat.first_kills_ct} / {mapStat.first_deaths_ct}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Green: first kills */}
                    {mapStat.first_kills_ct > 0 && (
                      <div
                        className="h-full bg-green-500/50 absolute left-0"
                        style={{
                          width: `${(mapStat.first_kills_ct / (mapStat.first_kills_ct + mapStat.first_deaths_ct)) * 100}%`
                        }}
                      />
                    )}
                    {/* Red: first deaths */}
                    {mapStat.first_deaths_ct > 0 && (
                      <div
                        className="h-full bg-red-500/50 absolute"
                        style={{
                          left: `${(mapStat.first_kills_ct / (mapStat.first_kills_ct + mapStat.first_deaths_ct)) * 100}%`,
                          width: `${(mapStat.first_deaths_ct / (mapStat.first_kills_ct + mapStat.first_deaths_ct)) * 100}%`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* T Side First Kills/Deaths */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">T First Kills/Deaths</span>
                    <span>
                      {mapStat.first_kills_t} / {mapStat.first_deaths_t}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Green: first kills */}
                    {mapStat.first_kills_t > 0 && (
                      <div
                        className="h-full bg-green-500/50 absolute left-0"
                        style={{
                          width: `${(mapStat.first_kills_t / (mapStat.first_kills_t + mapStat.first_deaths_t)) * 100}%`
                        }}
                      />
                    )}
                    {/* Red: first deaths */}
                    {mapStat.first_deaths_t > 0 && (
                      <div
                        className="h-full bg-red-500/50 absolute"
                        style={{
                          left: `${(mapStat.first_kills_t / (mapStat.first_kills_t + mapStat.first_deaths_t)) * 100}%`,
                          width: `${(mapStat.first_deaths_t / (mapStat.first_kills_t + mapStat.first_deaths_t)) * 100}%`
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Flash Quality Statistics */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Flash Quality
                </h4>

                {/* Enemy Flash Duration */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">
                      Avg Enemy Flash Duration
                    </span>
                    <span>{mapStat.avg_enemy_flash_duration.toFixed(1)}s</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/50"
                      style={{
                        width: `${Math.min(100, (mapStat.avg_enemy_flash_duration / 3) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Teammate Flash Duration */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">
                      Avg Teammate Flash Duration
                    </span>
                    <span>
                      {mapStat.avg_teammate_flash_duration.toFixed(1)}s
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500/50"
                      style={{
                        width: `${Math.min(100, (mapStat.avg_teammate_flash_duration / 3) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
