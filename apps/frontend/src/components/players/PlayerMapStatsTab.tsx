"use client";

import { useFilters } from "@/context/FilterContext";
import { PlayerMapStatsCards } from "./PlayerMapStatsCards";
import { MultiFilters } from "../filters/MultiFilters";

interface PlayerMapStatsTabProps {
  steamId: string;
}

export const PlayerMapStatsTab = ({ steamId }: PlayerMapStatsTabProps) => {
  const { filterParams } = useFilters();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Map Performance</h2>

      <MultiFilters
        {...filterParams}
        steamId={steamId}
        hideFilters={{
          stages: true,
          teams: true,
          seasons: true,
          leagues: true
        }}
        hideClearFilters
      />

      {/* Map Stats Cards */}
      <PlayerMapStatsCards steamId={steamId} />
    </div>
  );
};
