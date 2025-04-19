"use client";

import React from "react";

import { MultiFilters } from "@/components/filters/multi-filters";
import { TopTeamsGrid } from "@/components/topteams/top-teams-grid";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { TheContainer } from "@/components/layout/the-container";

export default function TopTeamsPage() {
  const activeSeasonHook = useActiveSeason("730");

  if (!activeSeasonHook.filterParams) {
    return <TheContainer>Fetching active season...</TheContainer>;
  }

  return (
    <WithActiveSeason>
      <div className="p-0">
        <MultiFilters
          seasons={activeSeasonHook.filterParams.seasons}
          leagues={activeSeasonHook.filterParams.leagues}
          stages={activeSeasonHook.filterParams.stages}
          teams={null}
          maps={activeSeasonHook.filterParams.maps}
        />

        <div className="min-h-fit pb-8 px-4 bg-card">
          <div className="max-w-[1400px] mx-auto">
            <TopTeamsGrid filterQueryParams={activeSeasonHook.filterParams} />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
