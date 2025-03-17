"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { MultiFilters } from "@/components/filters/multi-filters";
import { envConfig } from "@/configs/env";

interface TeamStats {
  name: string;
  teamName?: string;
  logo?: string;
  kana: number;
  matches: number;
  rank: number;
}

interface Division {
  title: string;
  type: string;
  teams: TeamStats[];
  emoji?: string;
}

const getParamArray = (searchParams: ReadonlyURLSearchParams, key: string) =>
  searchParams
    .getAll(key)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort();

export default function TopTeamsPage() {
  const searchParams = useSearchParams();
  const activeSeason = envConfig.ACTIVE_SEASON;

  const initialParams = useMemo(
    () => ({
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      maps: getParamArray(searchParams, "maps")
    }),
    [searchParams]
  );

  if (initialParams.seasons.length === 0) {
    initialParams.seasons = [activeSeason];
  }

  // Dummy data that can be replaced with backend data later
  const divisions: Division[] = [
    {
      title: "MASTERS",
      type: "REGULAR",
      emoji: "👑",
      teams: [
        {
          name: "Digia",
          teamName: "Vengers",
          logo: "/images/S14_2000.webp",
          kana: 0.91,
          matches: 15,
          rank: 1
        },
        {
          name: "JIS",
          teamName: "AUTOMATION",
          logo: "/images/S14_2000.webp",
          kana: 0.88,
          matches: 14,
          rank: 2
        },
        {
          name: "Elisa",
          teamName: "Hosujat",
          logo: "/images/S14_2000.webp",
          kana: 0.86,
          matches: 13,
          rank: 3
        },
        {
          name: "Valtori",
          logo: "/images/S14_2000.webp",
          kana: 0.85,
          matches: 15,
          rank: 4
        },
        {
          name: "ALM",
          teamName: "Partners",
          logo: "/images/S14_2000.webp",
          kana: 0.84,
          matches: 12,
          rank: 5
        }
      ]
    },
    {
      title: "CHALLENGERS",
      type: "REGULAR",
      emoji: "🏆",
      teams: [
        {
          name: "Frendy",
          teamName: "Fire",
          logo: "/images/S14_2000.webp",
          kana: 0.93,
          matches: 14,
          rank: 1
        },
        {
          name: "Visma",
          teamName: "in Pyjamas",
          logo: "/images/S14_2000.webp",
          kana: 0.88,
          matches: 15,
          rank: 2
        },
        {
          name: "Tampereen",
          teamName: "Energia",
          logo: "/images/S14_2000.webp",
          kana: 0.87,
          matches: 13,
          rank: 3
        },
        {
          name: "Telia",
          teamName: "Finland",
          logo: "/images/S14_2000.webp",
          kana: 0.86,
          matches: 14,
          rank: 4
        },
        {
          name: "Team",
          teamName: "Incoach",
          logo: "/images/S14_2000.webp",
          kana: 0.85,
          matches: 12,
          rank: 5
        }
      ]
    },
    {
      title: "PROSPECTS",
      type: "REGULAR",
      emoji: "⭐",
      teams: [
        {
          name: "Lc",
          teamName: "Partners",
          logo: "/images/S14_2000.webp",
          kana: 0.932,
          matches: 15,
          rank: 1
        },
        {
          name: "AreCloud",
          teamName: "NextGen",
          logo: "/images/S14_2000.webp",
          kana: 0.894,
          matches: 14,
          rank: 2
        },
        {
          name: "Securitas",
          teamName: "1",
          logo: "/images/S14_2000.webp",
          kana: 0.887,
          matches: 13,
          rank: 3
        },
        {
          name: "WIOSS",
          teamName: "KT",
          logo: "/images/S14_2000.webp",
          kana: 0.875,
          matches: 15,
          rank: 4
        },
        {
          name: "Elisa",
          teamName: "VakioPEEK",
          logo: "/images/S14_2000.webp",
          kana: 0.872,
          matches: 12,
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
        teams={[]}
        maps={initialParams.maps}
      />

      <div
        className="min-h-fit pb-8 px-4"
        style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-bold text-orange-400 py-8">Top Teams</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {divisions.map((division, index) => (
              <div
                key={index}
                className="bg-[#1a1a1a] rounded-sm overflow-hidden"
              >
                <div className="bg-[#2a1810] p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{division.emoji}</span>
                    <div>
                      <h2 className="text-orange-400 text-xl font-bold">
                        {division.title}
                      </h2>
                      <div className="text-orange-400/80">{division.type}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {division.teams.map((team, teamIndex) => (
                    <div
                      key={teamIndex}
                      className={`flex items-center justify-between py-3 px-2 ${
                        teamIndex < 3 ? "bg-[#1e1e1e] rounded-sm mb-1" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className={`w-6 text-center ${
                            teamIndex === 0
                              ? "text-yellow-400 font-bold"
                              : teamIndex === 1
                                ? "text-gray-400 font-bold"
                                : teamIndex === 2
                                  ? "text-amber-700 font-bold"
                                  : "text-gray-500"
                          }`}
                        >
                          {teamIndex === 0
                            ? "👑"
                            : teamIndex === 1
                              ? "🥈"
                              : teamIndex === 2
                                ? "🥉"
                                : `#${team.rank}`}
                        </span>

                        <div className="flex items-center gap-2">
                          {team.logo && (
                            <Image
                              src={team.logo}
                              alt={`${team.name} logo`}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          )}
                          <div>
                            <span
                              className={`${
                                teamIndex < 3
                                  ? "font-bold text-white"
                                  : "text-gray-300"
                              }`}
                            >
                              {team.name}
                            </span>
                            {team.teamName && (
                              <span className="text-gray-500 text-sm ml-2">
                                {team.teamName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">
                          {team.matches} matches
                        </span>
                        <span
                          className={`w-16 text-right ${
                            teamIndex < 3
                              ? "font-bold text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {team.kana.toFixed(2)}
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
