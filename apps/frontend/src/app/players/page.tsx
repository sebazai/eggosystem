"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { usePlayers } from "@/hooks/data/usePlayers";
import { PlayerTable } from "@/components/players/player-table";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { TheContainer } from "@/components/layout/the-container";

export default function PlayersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSeasonHook = useActiveSeason("730");

  const params = useMemo(() => {
    const seasons = getParamArray(searchParams, "seasons");
    const activeSeason = activeSeasonHook.activeSeason?.season_id;
    return {
      seasons: activeSeason && seasons.length === 0 ? [activeSeason] : seasons,
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  // Get players data based on filters
  const { players, isLoading, isError } = usePlayers({
    season_ids: params.seasons.length ? params.seasons : null,
    league_ids: params.leagues.length ? params.leagues : null,
    team_ids: params.teams.length ? params.teams : null,
    stages: params.stages.length ? params.stages : null,
    map_ids: params.maps.length ? params.maps : null
  });

  const handlePlayerClick = (nickname: string) => {
    router.push(`/players/${encodeURIComponent(nickname)}`);
  };

  if (isError) {
    return <TheContainer>Error loading players data</TheContainer>;
  }

  return (
    <WithActiveSeason>
      <div className="p-0">
        <MultiFilters
          seasons={params.seasons}
          leagues={params.leagues}
          stages={params.stages}
          teams={params.teams}
          maps={params.maps}
        />

        <div
          className="min-h-fit pb-8 px-4"
          style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
        >
          <div className="max-w-[1400px] mx-auto">
            <h1 className="text-kanaliiga-orange text-3xl font-bold py-8">
              Players
            </h1>

            <PlayerTable
              players={players}
              isLoading={isLoading}
              onPlayerClick={handlePlayerClick}
            />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
