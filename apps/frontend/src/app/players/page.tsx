"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { PlayerTable } from "@/components/players/player-table";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { PlayerNameFilter } from "@/components/filters/player-name-filter";

export default function PlayersPage() {
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

  return (
    <WithActiveSeason>
      <div className="p-0">
        {/* Filter section */}
        <div className="mb-4">
          <MultiFilters
            seasons={params.seasons}
            leagues={params.leagues}
            stages={params.stages}
            teams={params.teams}
            maps={params.maps}
          />

          <div className="px-1">
            <PlayerNameFilter
              initialPlayerName={searchParams.get("playerName") ?? ""}
            />
          </div>
        </div>

        <div className="min-h-fit pb-8 px-4 bg-card">
          <div className="max-w-[1400px] mx-auto">
            <h1 className="text-kanaliiga-orange text-3xl font-bold py-8">
              Players
            </h1>

            <PlayerTable filterQueryParams={params} />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
