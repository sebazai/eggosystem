"use client";

import { PlayerMapStatsTab } from "@/components/players/PlayerMapStatsTab";
import { useFilters } from "@/context/FilterContext";

export function PlayerMapStatsContent({ steamId }: { steamId: string }) {
  const { filterParams } = useFilters();

  return (
    <PlayerMapStatsTab steamId={steamId} filterQueryParams={filterParams} />
  );
}
