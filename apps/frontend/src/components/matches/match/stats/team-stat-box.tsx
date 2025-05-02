import { createNextUrl } from "@/lib/utils";
import type { MatchTeamStats } from "@eggosystem/types";
import Image from "next/image";
import Link from "next/link";
import type { TeamStatsFilters } from "./team-statistics";

export const TeamStatBox = ({
  team,
  teamStatsFilters
}: {
  team: MatchTeamStats;
  teamStatsFilters: TeamStatsFilters;
}) => {
  return (
    <div className="p-4">
      <Link
        href={{
          pathname: `/teams/${team.team_id}`,
          query: new URLSearchParams({ ...teamStatsFilters }).toString()
        }}
        className="hover:bg-kanaliiga-light-brown/40 px-2 py-1 rounded transition-colors inline-block mb-4"
      >
        <h3 className="text-base font-bold text-kanaliiga-orange">
          {team.name}
        </h3>
      </Link>
      <div className="space-y-3">
        {team.score && team.team_ht_score && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Breakdown</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Image
                  src={createNextUrl("/images/t-side-crossed-swords.webp")}
                  alt="Terrorist"
                  width={16}
                  height={16}
                  className="mr-1"
                />
                <span className="text-yellow-500">
                  {team.starting_side === "T"
                    ? team.team_ht_score
                    : team.score - team.team_ht_score}
                </span>
              </div>
              <div className="flex items-center">
                <Image
                  src={createNextUrl("/images/ct-side-pliers.webp")}
                  alt="Counter-Terrorist"
                  width={16}
                  height={16}
                  className="mr-1"
                />
                <span className="text-blue-500">
                  {team.starting_side === "CT"
                    ? team.team_ht_score
                    : team.score - team.team_ht_score}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">First kills</span>
          <span>{team.first_kills}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Clutches won</span>
          <span>{team.clutches_won}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bombs planted</span>
          <span>{team.plants}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Trades</span>
          <span>{team.trades}</span>
        </div>
      </div>
    </div>
  );
};
