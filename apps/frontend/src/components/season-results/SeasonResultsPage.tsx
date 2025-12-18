"use client";

import React from "react";
import { Trophy, Medal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useSeasonResults,
  useSeasonResultsSeasons
} from "@/hooks/data/useSeasonResults";
import { CardContainer } from "@/components/layout/CardContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {
  SeasonResultsTeam,
  SeasonResultsDivision
} from "@eggosystem/types";
import { createTeamLogoUrl, convertSeasonToS } from "@/lib/utils";

const PlacementBadge = ({ placement }: { placement: number }) => {
  const getBadgeStyle = () => {
    switch (placement) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-black";
      case 2:
        return "bg-gradient-to-r from-slate-300 to-slate-400 text-black";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div
      className={clsx(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
        getBadgeStyle()
      )}
    >
      {placement}
    </div>
  );
};

const TeamRow = ({ team }: { team: SeasonResultsTeam }) => {
  const logoUrl = team.team_logo ? createTeamLogoUrl(team.team_logo) : null;

  return (
    <Link
      href={`/teams/${team.team_id}`}
      className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <PlacementBadge placement={team.placement} />
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={team.team_name}
          width={36}
          height={36}
          className="rounded"
          unoptimized
        />
      ) : (
        <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <span className="font-medium truncate">{team.team_name}</span>
    </Link>
  );
};

const DivisionSection = ({ division }: { division: SeasonResultsDivision }) => {
  return (
    <div className="mb-6">
      <h2 className="text-kanaliiga-orange font-bold text-lg mb-3 flex items-center gap-2">
        <Medal className="h-5 w-5" />
        {division.league_name}
      </h2>
      <CardContainer classNames="p-2 md:p-4">
        <div className="divide-y divide-border">
          {division.teams.map((team) => (
            <TeamRow key={team.team_id} team={team} />
          ))}
        </div>
      </CardContainer>
    </div>
  );
};

export const SeasonResultsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get season from URL params
  const seasonParam = searchParams.get("season");
  const selectedSeasonId = seasonParam ? parseInt(seasonParam) : null;

  // Fetch available seasons
  const { seasons, isLoading: seasonsLoading } = useSeasonResultsSeasons();

  // Use the first season as default when seasons load and none selected
  const firstSeason = seasons[0];
  const effectiveSeasonId: number | null =
    selectedSeasonId ?? firstSeason?.season_id ?? null;

  // Fetch results for the selected season
  const { data, isLoading, error } = useSeasonResults(effectiveSeasonId);

  const setSeasonId = (seasonId: string) => {
    const params = new URLSearchParams();
    params.set("season", seasonId);
    router.push(`/season-results?${params.toString()}`);
  };

  if (error) {
    return (
      <ContentContainer>Failed to load Season Results data</ContentContainer>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            Season Results
          </h1>
          <p className="text-sm text-muted-foreground">
            Top 3 teams from each division for each season.
          </p>
        </div>

        <Select
          value={effectiveSeasonId?.toString() || ""}
          onValueChange={(value) => setSeasonId(value)}
          disabled={seasonsLoading || seasons.length === 0}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((season) => (
              <SelectItem
                key={season.season_id}
                value={season.season_id.toString()}
              >
                {convertSeasonToS(season.season_name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading || seasonsLoading ? (
        <ContentContainer classNames="min-h-[30vh]">
          Loading...
        </ContentContainer>
      ) : !data || data.divisions.length === 0 ? (
        <ContentContainer classNames="min-h-[30vh]">
          No results data available for this season.
        </ContentContainer>
      ) : (
        <div>
          {data.divisions.map((division) => (
            <DivisionSection key={division.league_id} division={division} />
          ))}
        </div>
      )}
    </div>
  );
};
