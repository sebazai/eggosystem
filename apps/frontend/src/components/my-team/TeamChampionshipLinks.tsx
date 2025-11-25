"use client";

import { useMyTeamChampionships } from "@/hooks/data/useMyTeamChampionships";
import { Trophy, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { MyTeamDetails } from "@eggosystem/types";

interface TeamChampionshipLinksProps {
  team: Pick<MyTeamDetails, "season_id" | "league_id" | "team_name">;
}

export const TeamChampionshipLinks = ({ team }: TeamChampionshipLinksProps) => {
  const { championships, isLoading, isError } = useMyTeamChampionships(
    team.season_id,
    team.league_id
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>
      </div>
    );
  }

  if (isError || !championships || championships.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Trophy className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-wrap gap-1">
        {championships.map((championship) => (
          <Link
            key={championship.id}
            href={`https://www.faceit.com/en/cs2/leagues/${championship.external_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground hover:text-foreground px-2 py-1 rounded border hover:border-primary/50 transition-colors"
            title={`View ${championship.external_league_name} on FaceIT`}
          >
            <span>{championship.external_league_name}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  );
};
