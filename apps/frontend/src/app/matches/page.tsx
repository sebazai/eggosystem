"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "@/components/matches/filtered-matches-list";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import _ from "lodash";
import { WithActiveSeason } from "@/components/filters/with-active-season";

export default function AllMatches() {
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
      teams: getParamArray(searchParams, "teams"),
      maps: null
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  return (
    <div className="p-0">
      <h1>Recent matches</h1>
      <div className="py-2">
        <MultiFilters
          seasons={params.seasons}
          leagues={params.leagues}
          stages={params.stages}
          teams={params.teams}
          maps={params.maps}
        />
      </div>
      <WithActiveSeason>
        <FilteredMatchesList filterQueryParams={params} />
      </WithActiveSeason>
    </div>
  );
}
