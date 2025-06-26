"use client";

import { TeamMapStatsTab } from "@/components/teams/TeamMapStatsTab";
import { useFilters } from "@/context/FilterContext";
import { useParams } from "next/navigation";

export function TeamMapStatsContent() {
  const params = useParams();
  const teamId = Number(params.teamId);
  const { filterParams } = useFilters();

  return <TeamMapStatsTab teamId={teamId} filterQueryParams={filterParams} />;
}
