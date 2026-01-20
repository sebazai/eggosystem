"use client";

import { useFilteredTeamMapStats } from "@/hooks/data/filtered/useFilteredTeamMapStats";
import { useFilteredTeamPistolWins } from "@/hooks/data/filtered/useFilteredTeamPistolWins";
import { useFilteredTeamPlantStats } from "@/hooks/data/filtered/useFilteredTeamPlantStats";
import { useFilteredTeamRetakeStats } from "@/hooks/data/filtered/useFilteredTeamRetakeStats";
import { useFilteredTeamTradeMapStats } from "@/hooks/data/filtered/useFilteredTeamTradeMapStats";
import { type FilterParamsQuery } from "@/lib/utils";
import { TeamMapStatCard } from "./TeamMapStatCard";

interface TeamMapStatsCardsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

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

  const { teamPlantStats, isLoading: isPlantStatsLoading } =
    useFilteredTeamPlantStats({
      teamId,
      filterQueryParams
    });

  const { teamRetakeStats, isLoading: isRetakeStatsLoading } =
    useFilteredTeamRetakeStats({
      teamId,
      filterQueryParams
    });

  const { teamTradeMapStats, isLoading: isTradeStatsLoading } =
    useFilteredTeamTradeMapStats({
      teamId,
      filterQueryParams
    });

  if (
    isMapStatsLoading ||
    isPistolStatsLoading ||
    isPlantStatsLoading ||
    isRetakeStatsLoading ||
    isTradeStatsLoading
  ) {
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

  // Handle empty state
  if (!teamMapStats || teamMapStats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No detailed map statistics available
        </p>
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

  // Create a map of plant stats by map_id for easy lookup
  const plantStatsByMapId = (teamPlantStats || []).reduce(
    (acc, stat) => {
      acc[stat.map_id] = stat;
      return acc;
    },
    {} as Record<number, (typeof teamPlantStats)[0]>
  );

  // Create a map of retake stats by map_id for easy lookup
  const retakeStatsByMapId = (teamRetakeStats || []).reduce(
    (acc, stat) => {
      acc[stat.map_id] = stat;
      return acc;
    },
    {} as Record<number, (typeof teamRetakeStats)[0]>
  );

  // Create a map of trade stats by map_id for easy lookup
  const tradeStatsByMapId = (teamTradeMapStats || []).reduce(
    (acc, stat) => {
      acc[stat.map_id] = stat;
      return acc;
    },
    {} as Record<number, (typeof teamTradeMapStats)[0]>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teamMapStats.map((mapStat) => {
        const pistolStat = pistolStatsByMapId[mapStat.map_id];
        const plantStat = plantStatsByMapId[mapStat.map_id];
        const retakeStat = retakeStatsByMapId[mapStat.map_id];
        const tradeStat = tradeStatsByMapId[mapStat.map_id];

        return (
          <TeamMapStatCard
            key={mapStat.map_id}
            mapStat={mapStat}
            pistolStat={pistolStat}
            plantStat={plantStat}
            retakeStat={retakeStat}
            tradeStat={tradeStat}
          />
        );
      })}
    </div>
  );
};
