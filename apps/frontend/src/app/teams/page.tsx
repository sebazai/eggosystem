"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { TeamsGrid } from "@/components/teams/teams-grid";

export default function TeamsPage() {
  const searchParams = useSearchParams();
  const activeSeasonHook = useActiveSeason("730");

  const params = useMemo(() => {
    const seasons = getParamArray(searchParams, "seasons");
    const activeSeason = activeSeasonHook.activeSeason?.season_id;
    return {
      seasons:
        activeSeason && seasons.length === 0 && searchParams.size === 0
          ? [activeSeason]
          : seasons,
      leagues: getParamArray(searchParams, "leagues"),
      teams: getParamArray(searchParams, "teams"),
      stages: null,
      maps: null
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  return (
    <WithActiveSeason>
      <div className="p-0">
        <MultiFilters
          seasons={params.seasons}
          leagues={params.leagues}
          teams={params.teams}
          stages={null}
          maps={null}
        />

        <div
          className="min-h-fit pb-8 px-4"
          style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
        >
          <div className="max-w-[1400px] mx-auto">
            <h1 className="text-kanaliiga-orange text-3xl font-bold py-8">
              Teams
            </h1>

            <TeamsGrid filterQueryParams={params} />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
