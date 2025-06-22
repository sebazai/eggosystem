"use client";

import { useFilteredPlayerMapStats } from "@/hooks/data/filtered/useFilteredPlayerMapStats";
import { mapToReadableName, type FilterParamsQuery } from "@/lib/utils";
import Image from "next/image";
import { Alert, AlertDescription } from "../ui/alert";
import { InfoIcon } from "lucide-react";

interface PlayerMapStatsCardsProps {
  steamId: string;
  filterQueryParams: FilterParamsQuery;
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

export const PlayerMapStatsCards = ({
  steamId,
  filterQueryParams
}: PlayerMapStatsCardsProps) => {
  const { playerMapStats, isLoading } = useFilteredPlayerMapStats({
    steamId,
    filterQueryParams
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
                <div className="flex justify-between text-xs mt-2">
                  <span>Headshot %</span>
                  <span className="font-medium">
                    {mapStat.hs_percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
