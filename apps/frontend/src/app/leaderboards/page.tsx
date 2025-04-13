"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { useLeaderboards } from "@/hooks/data/useLeaderboards";
import { LeaderboardsGrid } from "@/components/leaderboards/leaderboards-grid";
import { TheContainer } from "@/components/layout/the-container";

export default function LeaderboardsPage() {
  const activeSeasonHook = useActiveSeason("730");
  const searchParams = useSearchParams();

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

  const { isError, isLoading, isValidating, leaderboards } =
    useLeaderboards(params);

  if (isError) {
    return (
      <TheContainer>
        {isError?.message ?? "Error loading leaderboards"}
      </TheContainer>
    );
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
            <LeaderboardsGrid
              leaderboards={leaderboards}
              isLoading={isLoading || isValidating}
            />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
