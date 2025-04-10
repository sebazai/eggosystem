"use client";

import Image from "next/image";
import React, { useMemo } from "react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";

interface LeaderboardPlayer {
  name: string;
  team: string;
  teamLogo: string;
  value: number;
  matches: number;
  rank: number;
}

interface LeaderboardCategory {
  title: string;
  unit: string;
  players: LeaderboardPlayer[];
}

const getParamArray = (searchParams: ReadonlyURLSearchParams, key: string) =>
  searchParams
    .getAll(key)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort();

export default function LeaderboardsPage() {
  const searchParams = useSearchParams();

  const initialParams = useMemo(
    () => ({
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
    }),
    [searchParams]
  );

  // Dummy data that can be replaced with backend data later
  const leaderboardCategories: LeaderboardCategory[] = [
    {
      title: "Kana Rating",
      unit: "",
      players: [
        {
          name: "eRa-",
          team: "EA T20",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_1997.png",
          value: 1.68,
          matches: 15,
          rank: 1
        },
        {
          name: "kalski",
          team: "Nitor Goats",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_1999.png",
          value: 1.63,
          matches: 12,
          rank: 2
        },
        {
          name: "Tip",
          team: "Flow Invoicing",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_1998.png",
          value: 1.63,
          matches: 14,
          rank: 3
        },
        {
          name: "gubbe",
          team: "PV-1",
          teamLogo: "",
          value: 1.35,
          matches: 10,
          rank: 4
        },
        {
          name: "uti",
          team: "Skillwell",
          teamLogo: "",
          value: 1.35,
          matches: 11,
          rank: 5
        }
      ]
    },
    {
      title: "Average KAST",
      unit: "%",
      players: [
        {
          name: "Shiba-Sumo",
          team: "Colossal Order",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_2000.png",
          value: 97.0,
          matches: 13,
          rank: 1
        },
        {
          name: "kalski",
          team: "Nitor Goats",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_1999.png",
          value: 96.0,
          matches: 12,
          rank: 2
        },
        {
          name: "Tip",
          team: "Flow Invoicing",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_1998.png",
          value: 90.1,
          matches: 14,
          rank: 3
        },
        {
          name: "LebiJäbä",
          team: "AFRY Espoo",
          teamLogo: "",
          value: 89.5,
          matches: 9,
          rank: 4
        },
        {
          name: "Axe2000",
          team: "ISLET",
          teamLogo: "",
          value: 89.0,
          matches: 11,
          rank: 5
        }
      ]
    },
    {
      title: "First Kills per Match",
      unit: "",
      players: [
        {
          name: "Nudeeee",
          team: "Cave Entertainment",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_2001.png",
          value: 7.0,
          matches: 12,
          rank: 1
        },
        {
          name: "eRa-",
          team: "EA T20",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_1997.png",
          value: 5.5,
          matches: 15,
          rank: 2
        },
        {
          name: "s1mple",
          team: "NAVI",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_1996.png",
          value: 5.2,
          matches: 13,
          rank: 3
        },
        {
          name: "ZywOo",
          team: "Vitality",
          teamLogo: "",
          value: 4.8,
          matches: 14,
          rank: 4
        },
        {
          name: "NiKo",
          team: "G2",
          teamLogo: "",
          value: 4.5,
          matches: 11,
          rank: 5
        }
      ]
    },
    {
      title: "Firstkill duels won",
      unit: "%",
      players: [
        {
          name: "Driiveri",
          team: "Valtori",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_2002.png",
          value: 100,
          matches: 10,
          rank: 1
        },
        {
          name: "snipsi22",
          team: "HYTKs",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_2003.png",
          value: 100,
          matches: 12,
          rank: 2
        },
        {
          name: "device",
          team: "Astralis",
          teamLogo: "https://stats.kanaliiga.fi/img/S14_2004.png",
          value: 95,
          matches: 15,
          rank: 3
        },
        {
          name: "rain",
          team: "FaZe",
          teamLogo: "",
          value: 92,
          matches: 11,
          rank: 4
        },
        {
          name: "ropz",
          team: "MOUZ",
          teamLogo: "",
          value: 90,
          matches: 13,
          rank: 5
        }
      ]
    }
  ];

  return (
    <div className="p-0">
      <MultiFilters
        seasons={initialParams.seasons}
        leagues={initialParams.leagues}
        stages={initialParams.stages}
        teams={initialParams.teams}
        maps={initialParams.maps}
      />

      <div
        className="min-h-fit pb-8 px-4"
        style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-bold text-kanaliiga-orange py-8">
            Leaderboards
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leaderboardCategories.map((category, index) => (
              <div key={index} className="bg-card rounded-sm overflow-hidden">
                <div className="bg-[#2a1810] p-4">
                  <h2 className="text-xl font-bold text-kanaliiga-orange">
                    {category.title}
                  </h2>
                </div>

                <div className="p-4">
                  {category.players.map((player, playerIndex) => (
                    <div
                      key={playerIndex}
                      className={`flex items-center justify-between py-3 px-2 ${
                        playerIndex < 3 ? "bg-[#1e1e1e] rounded-sm mb-1" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className={`w-6 text-center ${
                            playerIndex === 0
                              ? "text-yellow-400 font-bold"
                              : playerIndex === 1
                                ? "text-muted-foreground font-bold"
                                : playerIndex === 2
                                  ? "text-amber-700 font-bold"
                                  : "text-muted-foreground"
                          }`}
                        >
                          {playerIndex === 0
                            ? "👑"
                            : playerIndex === 1
                              ? "🥈"
                              : playerIndex === 2
                                ? "🥉"
                                : `#${player.rank}`}
                        </span>

                        <div className="flex items-center gap-2">
                          {playerIndex === 0 && player.teamLogo && (
                            <Image
                              src={player.teamLogo}
                              alt={player.team}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          )}
                          <div>
                            <span
                              className={`${
                                playerIndex < 3
                                  ? "font-bold text-white"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {player.name}
                            </span>
                            <span className="text-muted-foreground text-sm ml-2">
                              {player.team}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground text-sm">
                          {player.matches} matches
                        </span>
                        <span
                          className={`w-16 text-right ${
                            playerIndex < 3
                              ? "font-bold text-white"
                              : "text-muted-foreground"
                          }`}
                        >
                          {player.value.toFixed(category.unit === "%" ? 1 : 2)}
                          {category.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
