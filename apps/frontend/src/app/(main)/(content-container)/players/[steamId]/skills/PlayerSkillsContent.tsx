"use client";

import { PlayerSkillTab } from "@/components/players/PlayerSkillTab";
import { useFilters } from "@/context/FilterContext";

export function PlayerSkillsContent({ steamId }: { steamId: string }) {
  const { filterParams } = useFilters();

  return <PlayerSkillTab steamId={steamId} filterQueryParams={filterParams} />;
}
