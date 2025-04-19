"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { MultiFilters } from "@/components/filters/multi-filters";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { PlayerDetails } from "@/components/players/player-details";
import { TheContainer } from "@/components/layout/the-container";

interface PlayerDetailsProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default function PlayerDetailsPage({ params }: PlayerDetailsProps) {
  const unwrappedParams = React.use(params);
  const steamId = unwrappedParams.playerId;
  const activeSeasonHook = useActiveSeason("730");

  if (!activeSeasonHook.filterParams) {
    return <TheContainer>Fetching active season...</TheContainer>;
  }

  return (
    <WithActiveSeason>
      <div className="container mx-auto py-4">
        <div className="mb-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/players">Players</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{steamId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mb-3">
          <h2 className="text-xl font-semibold text-kanaliiga-orange mb-2">
            Filter Statistics
          </h2>
          <MultiFilters {...activeSeasonHook.filterParams} />
          <PlayerDetails
            steamId={steamId}
            filterParams={activeSeasonHook.filterParams}
          />
        </div>
      </div>
    </WithActiveSeason>
  );
}
