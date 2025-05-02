import { createStatsKanaliigaImageUrl } from "@/lib/utils";
import type {
  MatchPlayerStats,
  MatchTeamInfo,
  MatchInfo
} from "@eggosystem/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useSearchParams } from "next/navigation";

interface PlayerStatsFilters {
  seasons: string;
  leagues: string;
}

interface PlayerStatisticsProps {
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
  playerStatsFilters?: PlayerStatsFilters;
}

export const PlayerStatistics = ({
  playerStats,
  teams,
  playerStatsFilters
}: PlayerStatisticsProps) => {
  const search = useSearchParams();

  // Player Stats Grid section
  const groupedPlayerStats = React.useMemo(() => {
    if (!playerStats || !teams) return [];

    const statsMap = new Map<
      number,
      { team: MatchTeamInfo; players: MatchPlayerStats[] }
    >();

    for (const player of playerStats) {
      const team = teams[player.team_id];
      if (!team) continue;

      if (!statsMap.has(player.team_id)) {
        statsMap.set(player.team_id, {
          team,
          players: []
        });
      }

      statsMap.get(player.team_id)?.players.push(player);
    }

    return Array.from(statsMap.values());
  }, [playerStats, teams]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
      {groupedPlayerStats.map(({ team, players }) => {
        const teamSearchParams =
          search.size !== 0
            ? search.toString()
            : new URLSearchParams({
                ...playerStatsFilters
              }).toString();
        return (
          <div key={team.id} className="flex flex-col">
            {/* Team name bar */}
            <div className="flex items-center gap-2 p-3 mb-[1px] bg-kanaliiga-light-brown/20">
              <Link
                href={{
                  pathname: `/teams/${team.id}`,
                  query: teamSearchParams
                }}
                className="flex items-center gap-2 hover:bg-kanaliiga-light-brown/40 px-2 py-1 rounded transition-colors"
              >
                <Image
                  src={createStatsKanaliigaImageUrl(team.logo)}
                  alt={team.name}
                  className="w-6 h-6"
                  width={24}
                  height={24}
                />
                <h2 className="text-base font-bold">{team.name}</h2>
              </Link>
            </div>

            {/* Stats header - Desktop */}
            <div className="hidden sm:grid grid-cols-[2fr_repeat(7,1fr)] items-center text-xs text-muted-foreground py-2 px-3 sticky top-0 bg-kanaliiga-light-brown/20">
              <div className="text-left">PLAYER</div>
              <div className="text-center">K</div>
              <div className="text-center">D</div>
              <div className="text-center">+/-</div>
              <div className="text-center">ADR</div>
              <div className="text-center sm:hidden md:block">KAST</div>
              <div className="text-center sm:hidden md:block">HS%</div>
              <div className="text-center sm:hidden md:block">RATING</div>
            </div>

            {/* Mobile Headers - only player columns */}
            <div className="grid sm:hidden grid-cols-[2fr_repeat(4,1fr)] text-xs text-muted-foreground p-2 bg-kanaliiga-light-brown/20">
              <div>PLAYER</div>
              <div className="text-center">K</div>
              <div className="text-center">D</div>
              <div className="text-center">ADR</div>
              <div className="text-center">RATING</div>
            </div>

            {players.map((player) => {
              const playerSearchParams =
                search.size !== 0
                  ? search.toString()
                  : new URLSearchParams({
                      ...playerStatsFilters,
                      teams: team.id.toString()
                    }).toString();

              return (
                <Link
                  key={player.nickname}
                  className="cursor-pointer hover:bg-kanaliiga-light-brown/10"
                  href={{
                    pathname: `/players/${player.steam_id}`,
                    query: playerSearchParams
                  }}
                >
                  {/* Desktop Row */}
                  <div className="hidden sm:grid grid-cols-[2fr_repeat(7,1fr)] py-2 px-3 border-b border-gray-800 text-xs items-center">
                    <div className="text-left font-bold">{player.nickname}</div>
                    <div className="text-center">{player.kills}</div>
                    <div className="text-center">{player.deaths}</div>
                    <div
                      className={`text-center ${player.kills - player.deaths >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {player.kills - player.deaths >= 0
                        ? `+${player.kills - player.deaths}`
                        : player.kills - player.deaths}
                    </div>
                    <div className="text-center">
                      {typeof player.adr === "number"
                        ? player.adr.toFixed(1)
                        : player.adr}
                    </div>
                    <div className="text-center sm:hidden md:block">
                      {player.kast_percentage}
                      {" %"}
                    </div>
                    <div className="text-center sm:hidden md:block">
                      {player.hs_percent}%
                    </div>
                    <div className="text-center sm:hidden md:block">
                      {typeof player.kana_rating === "number"
                        ? player.kana_rating.toFixed(2)
                        : player.kana_rating}
                    </div>
                  </div>

                  {/* Mobile Row */}
                  <div className="grid sm:hidden grid-cols-[2fr_repeat(4,1fr)] py-2 px-3 border-b border-gray-800 text-xs items-center">
                    <div className="text-left font-bold">{player.nickname}</div>
                    <div className="text-center">{player.kills}</div>
                    <div className="text-center">{player.deaths}</div>
                    <div className="text-center">
                      {typeof player.adr === "number"
                        ? player.adr.toFixed(1)
                        : player.adr}
                    </div>
                    <div className="text-center font-medium">
                      {typeof player.kana_rating === "number"
                        ? player.kana_rating.toFixed(2)
                        : player.kana_rating}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
