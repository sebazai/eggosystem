"use client";

import React, { useMemo } from "react";

import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { TopTeamsGrid } from "@/components/topteams/top-teams-grid";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";

export default function TopTeamsPage() {
  const activeSeasonHook = useActiveSeason("730");
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const seasons = getParamArray(searchParams, "seasons");
    const activeSeason = activeSeasonHook.activeSeason?.season_id;
    return {
      seasons:
        activeSeason && seasons.length === 0 && searchParams.size === 0
          ? [activeSeason]
          : seasons,
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: null,
      maps: getParamArray(searchParams, "maps")
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  return (
    <WithActiveSeason>
      <div className="p-0">
        <MultiFilters
          seasons={params.seasons}
          leagues={params.leagues}
          stages={params.stages}
          teams={null}
          maps={params.maps}
        />

        <div
          className="min-h-fit pb-8 px-4"
          style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
        >
          <div className="max-w-[1400px] mx-auto">
            <TopTeamsGrid filterQueryParams={params} />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
