import { createStatsKanaliigaImageUrl } from "@/lib/utils";
import type {
  MatchInfo,
  MatchTopPlayerAwards,
  MatchTopPlayerAwardsValue
} from "@eggosystem/types";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

interface TopPlayerProps {
  topPlayers: MatchTopPlayerAwards;
  teams: MatchInfo["teams"];
}

const roundToOneDecimal = (num: number) =>
  num % 1 === 0 ? num : parseFloat(num.toFixed(1));

export const TopPlayers = ({ topPlayers, teams }: TopPlayerProps) => {
  const router = useRouter();

  const handlePlayerClick = (steamId: string) => {
    router.push(`/players/${encodeURIComponent(steamId)}`);
  };

  const awardNames: Record<keyof MatchTopPlayerAwards, string> = {
    most_kills: "Most Kills",
    most_adr: "Highest ADR",
    most_assists: "Most Assists",
    most_awp_kills: "Most AWP Kills",
    most_utility_damage: "Most Utility Damage",
    most_first_kills: "Most First Kills",
    most_mates_flashed: "Most Teammates Flashed",
    most_flash_assists: "Most Flash Assists"
  };

  return (
    <div className="mt-8 max-w-[600px]">
      <h2 className="text-kanaliiga-orange mb-4">TOP PLAYERS</h2>
      <div className="bg-card rounded-sm">
        <div className="grid grid-cols-[1.5fr_1fr_auto] gap-1  xs:gap-4 p-4">
          <div className="text-muted-foreground text-sm">Award</div>
          <div className="text-muted-foreground text-sm">Player</div>
          <div className="text-muted-foreground text-sm text-right">Score</div>
          {Object.entries(topPlayers).map(([key, value]) => {
            const awardsKey = key as keyof MatchTopPlayerAwards;
            const text = awardNames[awardsKey];
            const stat = value as MatchTopPlayerAwardsValue;
            const team = teams[stat.team_id];
            return (
              <React.Fragment key={key}>
                <div className="text-muted-foreground text-sm">{text}</div>
                <div
                  className="flex gap-2 cursor-pointer hover:text-kanaliiga-orange"
                  onClick={() =>
                    stat && stat.steam_id && handlePlayerClick(stat.steam_id)
                  }
                >
                  {team && (
                    <div>
                      <Image
                        src={createStatsKanaliigaImageUrl(team.logo)}
                        alt={team.name}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    </div>
                  )}
                  <span className="text-sm">{stat.nickname}</span>
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
