import { NextImageFallback } from "@/components/layout/image-with-fallback";
import { createTeamLogoUrl } from "@/lib/utils";
import type {
  MatchInfo,
  MatchOrGameTopPlayerAwards,
  TopPlayerAwardsValue
} from "@eggosystem/types";
import Link from "next/link";
import React from "react";

interface TopPlayerFilters {
  seasons: string;
  leagues: string;
}

interface TopPlayerProps {
  topPlayers: MatchOrGameTopPlayerAwards;
  teams: MatchInfo["teams"];
  topPlayerFilters: TopPlayerFilters;
}

const roundToOneDecimal = (num: number) =>
  num % 1 === 0 ? num : parseFloat(num.toFixed(1));

const awardNames: Record<keyof MatchOrGameTopPlayerAwards, string> = {
  most_kills: "Most Kills",
  most_adr: "Highest ADR",
  most_assists: "Most Assists",
  most_awp_kills: "Most AWP Kills",
  most_utility_damage: "Most Utility Damage",
  most_first_kills: "Most First Kills",
  most_mates_flashed: "Most Teammates Flashed",
  most_flash_assists: "Most Flash Assists"
};

export const TopPlayers = ({
  topPlayers,
  teams,
  topPlayerFilters
}: TopPlayerProps) => {
  return (
    <div className="mt-8 max-w-[600px]">
      <h2 className="mb-4">TOP PLAYERS</h2>
      <div className="bg-card rounded-sm">
        <div className="grid grid-cols-[1.5fr_1fr_auto] gap-4 p-4">
          <div className="text-muted-foreground text-sm">Award</div>
          <div className="text-muted-foreground text-sm">Player</div>
          <div className="text-muted-foreground text-sm text-right">Score</div>
          {(
            Object.entries(topPlayers) as [
              keyof MatchOrGameTopPlayerAwards,
              TopPlayerAwardsValue
            ][]
          ).map(([key, value]) => {
            const awardsKey = key;
            const text = awardNames[awardsKey];
            const stat = value;
            const team = teams[stat.team_id];

            const params = new URLSearchParams({ ...topPlayerFilters });
            return (
              <React.Fragment key={key}>
                <div className="text-muted-foreground text-sm">{text}</div>
                <div className="flex gap-2">
                  {team && (
                    <Link
                      href={{
                        pathname: `/teams/${team.id}`,
                        query: params.toString()
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <NextImageFallback
                        src={createTeamLogoUrl(team.logo)}
                        alt={team.name}
                        width={16}
                        height={16}
                        title={`${team.name} - Click to view team details`}
                        className="rounded-full"
                      />
                    </Link>
                  )}
                  <Link
                    className="text-sm cursor-pointer hover:text-kanaliiga-orange"
                    href={{
                      pathname: `/players/${stat.steam_id}`,
                      query: params.toString()
                    }}
                  >
                    {stat.nickname}
                  </Link>
                </div>
                <div className="text-sm text-right">
                  {roundToOneDecimal(stat.value ?? 0)}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
