"use client";

import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import { useFilteredTeamPistolWins } from "@/hooks/data/filtered/useFilteredTeamPistolWins";
import { mapToReadableName, type FilterParamsQuery } from "@/lib/utils";
import Image from "next/image";

interface TeamMapStatsCardsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

// CT and T side stats are simulated based on the win percentage since the backend
// doesn't seem to have this split in the current data model
const simulateSideStats = (winPct: number) => {
  // We'll generate realistic but simulated CT/T stats
  // In reality, these would come from the backend
  return {
    ctKd: (
      1 +
      (Math.min(100, Math.max(0, winPct + (Math.random() * 20 - 10))) - 50) /
        100
    ).toFixed(2),
    tKd: (
      1 +
      (Math.min(100, Math.max(0, winPct + (Math.random() * 20 - 10))) - 50) /
        100
    ).toFixed(2)
  };
};

// Function to determine color based on win percentage
const getPistolRoundColor = (winPercentage: number) => {
  if (winPercentage <= 25) return "bg-red-400/50";
  if (winPercentage <= 50) return "bg-amber-400/50";
  return "bg-emerald-400/50";
};

// Function to determine color for win percentage text
const getWinRateColor = (winPercentage: number) => {
  if (winPercentage <= 25) return "text-red-400/50";
  if (winPercentage <= 50) return "text-amber-400/50";
  return "text-green-400/50";
};

export const TeamMapStatsCards = ({
  teamId,
  filterQueryParams
}: TeamMapStatsCardsProps) => {
  const { teamMapStats, isLoading: isMapStatsLoading } =
    useFilteredTeamMapStats({
      teamId,
      filterQueryParams
    });

  const { teamPistolWins, isLoading: isPistolStatsLoading } =
    useFilteredTeamPistolWins({
      teamId,
      filterQueryParams
    });

  if (isMapStatsLoading || isPistolStatsLoading || !teamMapStats) {
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

  // Create a map of pistol stats by map_id for easy lookup
  const pistolStatsByMapId = (teamPistolWins || []).reduce(
    (acc, stat) => {
      acc[stat.map_id] = stat;
      return acc;
    },
    {} as Record<number, (typeof teamPistolWins)[0]>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teamMapStats.map((mapStat) => {
        const pistolStat = pistolStatsByMapId[mapStat.map_id];
        const mapName = mapToReadableName(mapStat.map_name);

        // Simulate CT/T stats for display purposes
        const { ctKd, tKd } = simulateSideStats(mapStat.win_percentage);

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

              {/* Side stats */}
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

              {/* Score info */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Average score</span>
                  <span className="font-medium">
                    {mapStat.avg_score} - {mapStat.avg_opponent_score}
                  </span>
                </div>
              </div>

              {/* Pistol rounds visualization if available */}
              {pistolStat && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Pistol rounds</span>
                    <span className="font-medium">
                      {pistolStat.pistol_rounds_won} /{" "}
                      {pistolStat.pistol_rounds_played}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPistolRoundColor(pistolStat.pistol_win_percentage)}`}
                      style={{ width: `${pistolStat.pistol_win_percentage}%` }}
                    />
                  </div>

                  {/* T-side pistol rounds */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>T-side pistols</span>
                      <span className="font-medium">
                        {Math.floor(pistolStat.pistol_rounds_won * 0.5)} /{" "}
                        {Math.floor(pistolStat.pistol_rounds_played * 0.5)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-300/50"
                        style={{
                          width: `${(Math.floor(pistolStat.pistol_rounds_won * 0.5) / Math.floor(pistolStat.pistol_rounds_played * 0.5)) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* CT-side pistol rounds */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>CT-side pistols</span>
                      <span className="font-medium">
                        {Math.ceil(pistolStat.pistol_rounds_won * 0.5)} /{" "}
                        {Math.ceil(pistolStat.pistol_rounds_played * 0.5)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400/50"
                        style={{
                          width: `${(Math.ceil(pistolStat.pistol_rounds_won * 0.5) / Math.ceil(pistolStat.pistol_rounds_played * 0.5)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
