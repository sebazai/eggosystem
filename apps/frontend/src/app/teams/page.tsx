"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/multi-filters";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { TeamsGrid } from "@/components/teams/teams-grid";
import { TheContainer } from "@/components/layout/the-container";

export default function TeamsPage() {
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
          teams={activeSeasonHook.filterParams.teams}
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

            <TeamsGrid filterQueryParams={activeSeasonHook.filterParams} />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
