"use client";

import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { getParamArray, type FilterParamsQuery } from "@/lib/utils";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { useTeams } from "@/hooks/data/useTeams";
import { TeamsGrid } from "@/components/teams/teams-grid";

export default function TeamsPage() {
  const searchParams = useSearchParams();
  const activeSeasonHook = useActiveSeason("730");

  const params = useMemo(() => {
    const seasons = getParamArray(searchParams, "seasons");
    const activeSeason = activeSeasonHook.activeSeason?.season_id;
    const teams = getParamArray(searchParams, "teams");
    return {
      seasons: activeSeason && seasons.length === 0 ? [activeSeason] : seasons,
      leagues: getParamArray(searchParams, "leagues"),
      teams: teams,
      stages: null,
      maps: null
    } satisfies FilterParamsQuery;
  }, [searchParams, activeSeasonHook.activeSeason?.season_id]);

  // Get teams data based on filters
  const { teams, isLoading, error } = useTeams({
    season_ids: params.seasons.length ? params.seasons : null,
    league_ids: params.leagues.length ? params.leagues : null,
    team_ids: params.teams.length ? params.teams : null
  });

  // Debug log
  useEffect(() => {
    console.log("Teams data:", {
      teams: teams?.length,
      isLoading,
      hasError: !!error,
      activeSeasonLoading: activeSeasonHook.isLoading,
      activeSeason: activeSeasonHook.activeSeason,
      filters: params
    });
  }, [
    teams,
    isLoading,
    error,
    activeSeasonHook.isLoading,
    activeSeasonHook.activeSeason,
    params
  ]);

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
            <h1 className="text-kanaliiga-orange text-2xl font-bold py-6">
              Teams
            </h1>

            {error ? (
              <div className="bg-card rounded-md p-8 text-center">
                <p className="text-muted-foreground">
                  Error loading teams: {error.message}
                </p>
              </div>
            ) : (
              <TeamsGrid
                teams={teams}
                isLoading={isLoading || activeSeasonHook.isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
