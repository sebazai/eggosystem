"use client";

import { PlayerMapStatsCards } from "./PlayerMapStatsCards";
import type { FilterParamsQuery } from "@/lib/utils";

interface PlayerMapStatsTabProps {
  steamId: string;
  filterQueryParams: FilterParamsQuery;
}

export const PlayerMapStatsTab = ({
  steamId,
  filterQueryParams
}: PlayerMapStatsTabProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Map Performance</h2>

      {/* Map Stats Cards */}
      <PlayerMapStatsCards
        steamId={steamId}
        filterQueryParams={filterQueryParams}
      />
    </div>
  );
};
