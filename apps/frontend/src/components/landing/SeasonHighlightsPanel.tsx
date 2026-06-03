"use client";

import Link from "next/link";
import Image from "next/image";
import { Medal, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useSeasonResults,
  useSeasonResultsSeasons
} from "@/hooks/data/useSeasonResults";
import {
  createNextUrl,
  createTeamLogoUrl,
  convertSeasonToS
} from "@/lib/utils";
import type { SeasonResultsDivision } from "@eggosystem/types";

function SeasonHighlightsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="bg-white/5 border-white/10 animate-pulse">
          <CardContent className="p-4">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChampionRow({
  placement,
  teamName,
  teamLogo,
  teamId
}: {
  placement: number;
  teamName: string;
  teamLogo: string | null;
  teamId: number;
}) {
  const logoUrl = teamLogo ? createTeamLogoUrl(teamLogo) : null;

  return (
    <Link
      href={createNextUrl(`/teams/${teamId}`)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
    >
      <div className="w-7 h-7 rounded-full bg-kanaliiga-orange/20 text-kanaliiga-orange flex items-center justify-center text-sm font-bold shrink-0">
        {placement}
      </div>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={teamName}
          width={32}
          height={32}
          className="rounded shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm truncate">{teamName}</span>
    </Link>
  );
}

function DivisionHighlights({ division }: { division: SeasonResultsDivision }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Medal className="h-4 w-4 text-kanaliiga-orange" />
          <h3 className="text-sm font-medium text-kanaliiga-orange">
            {division.league_name}
          </h3>
        </div>
        <div className="divide-y divide-white/10">
          {division.teams.map((team) => (
            <ChampionRow
              key={team.team_id}
              placement={team.placement}
              teamName={team.team_name}
              teamLogo={team.team_logo}
              teamId={team.team_id}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SeasonHighlightsPanel() {
  const { seasons, isLoading: isLoadingSeasons } = useSeasonResultsSeasons();
  const latestSeason = seasons[0];
  const { data, isLoading: isLoadingResults } = useSeasonResults(
    latestSeason?.season_id ?? null
  );

  const isLoading = isLoadingSeasons || isLoadingResults;
  const divisions = data?.divisions ?? [];
  const seasonLabel = latestSeason?.season_name
    ? convertSeasonToS(latestSeason.season_name)
    : "Latest Season";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl 2xl:text-3xl flex items-center gap-2">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 2xl:h-7 2xl:w-7 text-kanaliiga-orange" />
          Season Highlights
        </h2>
        {latestSeason ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-kanaliiga-orange hover:text-kanaliiga-orange/80 text-sm sm:text-base 2xl:text-lg h-auto px-2 sm:px-4"
            asChild
          >
            <Link
              href={createNextUrl(
                `/season-results?season=${latestSeason.season_id}`
              )}
            >
              View Results
            </Link>
          </Button>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {seasonLabel} has concluded. Here are the top finishers from every
        division.
      </p>

      {isLoading ? (
        <SeasonHighlightsSkeleton />
      ) : divisions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[min(70vh,720px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground">
          {divisions.map((division) => (
            <DivisionHighlights key={division.league_id} division={division} />
          ))}
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-2">Season results coming soon</p>
            <p className="text-sm text-muted-foreground mb-4">
              Final placements are still being finalized.
            </p>
            <Button variant="outline" className="border-white/20" asChild>
              <Link href={createNextUrl("/past-seasons")}>
                Browse Past Seasons
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
