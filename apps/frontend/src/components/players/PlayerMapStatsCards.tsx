"use client";

import { useFilteredPlayerMapStats } from "@/hooks/data/filtered/useFilteredPlayerMapStats";
import { Alert, AlertDescription } from "../ui/alert";
import { InfoIcon } from "lucide-react";
import { useFilters } from "@/context/FilterContext";
import { MapStatCard } from "./MapStatCard";

interface PlayerMapStatsCardsProps {
  steamId: string;
}

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
            <div className="h-32 bg-gray-800"></div>
            <div className="h-10 bg-gray-800/50 flex gap-1 p-1">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex-1 h-full bg-gray-700 rounded" />
              ))}
            </div>
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-8 bg-gray-800 rounded" />
              ))}
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
      {playerMapStats.map((mapStat) => (
        <MapStatCard key={mapStat.map_id} mapStat={mapStat} />
      ))}
    </div>
  );
};
