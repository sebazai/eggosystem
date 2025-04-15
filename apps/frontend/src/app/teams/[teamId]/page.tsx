"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { getParamArray } from "@/lib/utils";
import { useTeamDetails } from "@/hooks/data/useTeamDetails";
import { PlayerTable } from "@/components/players/player-table";
import { TeamMatches } from "@/components/teams/team-matches";
import { MapFilter } from "@/components/teams/map-filter";
import { TheContainer } from "@/components/layout/the-container";

interface TeamDetailsPageProps {
  params: {
    teamId: string;
  };
}

export default function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const { teamId } = params;
  const searchParams = useSearchParams();

  // Get map filter IDs from the URL
  const map_ids = useMemo(() => {
    return getParamArray(searchParams, "map_ids");
  }, [searchParams]);

  // Get team details
  const { teamDetails, isLoading, error } = useTeamDetails({
    teamId,
    map_ids: map_ids.length ? map_ids : null
  });

  if (error) {
    return <TheContainer>Error loading team details</TheContainer>;
  }

  if (isLoading) {
    return (
      <TheContainer>
        <div className="animate-pulse flex flex-col space-y-6">
          <div className="h-8 w-40 bg-gray-800 rounded"></div>
          <div className="h-24 w-full bg-gray-800 rounded"></div>
          <div className="h-64 w-full bg-gray-800 rounded"></div>
        </div>
      </TheContainer>
    );
  }

  if (!teamDetails) {
    return <TheContainer>Team not found</TheContainer>;
  }

  const { team, players, matches } = teamDetails;

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/teams">Teams</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{team.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Team Header */}
      <div className="bg-card rounded-md overflow-hidden mb-8">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Image
              src={team.team_logo}
              alt={team.name}
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">
                  {team.league_name}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {team.season_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Matches" value={team.matches_played.toString()} />
            <StatCard label="Wins" value={team.wins.toString()} />
            <StatCard label="Losses" value={team.losses.toString()} />
            <StatCard
              label="Win %"
              value={`${team.win_percentage.toFixed(1)}%`}
              highlight={team.win_percentage > 50}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Players Section - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <h2 className="text-kanaliiga-orange text-2xl font-bold mb-4">
            Team Players
          </h2>

          <PlayerTable players={players} isLoading={false} />
        </div>

        {/* Matches Section - 1/3 width on large screens */}
        <div>
          <h2 className="text-kanaliiga-orange text-2xl font-bold mb-4">
            Team Matches
          </h2>

          <MapFilter activeMapIds={map_ids} />

          <TeamMatches matches={matches} isLoading={false} />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ label, value, highlight = false }: StatCardProps) {
  return (
    <div className="bg-kanaliiga-light-brown/10 p-4 rounded-md">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div
        className={`text-xl font-semibold mt-1 ${highlight ? "text-kanaliiga-orange" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
