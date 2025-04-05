"use client";

import React, { useMemo, useEffect, useState } from "react";
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

interface BackendTeamStats {
  team_id: number;
  team_name: string;
  team_logo: string;
  league_name: string;
  matches_played: number;
  kana: number;
  rank: number;
  stage: number;
}

interface League {
  id: number;
  name: string;
}

const getParamArray = (searchParams: ReadonlyURLSearchParams, key: string) =>
  searchParams
    .getAll(key)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort();

const getLeagueEmoji = (leagueName: string): string => {
  const leagueNameLower = leagueName.toLowerCase();
  switch (leagueNameLower) {
    case "masters":
      return "👑";
    case "challengers":
      return "🏆";
    case "prospects":
      return "⭐";
    case "div2":
    case "div3":
    case "div4":
    case "div5":
    case "div6":
      return "🎮";
    default:
      return "";
  }
};

const formatDivisionTitle = (leagueName: string, stageType: string): string => {
  // Convert stage type to Title Case
  const formattedStage =
    stageType.charAt(0).toUpperCase() + stageType.slice(1).toLowerCase();
  return `${leagueName}, ${formattedStage}`;
};

const getStageType = (stage: number): string => {
  switch (stage) {
    case 1:
      return "Regular";
    case 2:
      return "Playoffs";
    default:
      return "Regular";
  }
};

const transformBackendData = (data: BackendTeamStats[]): Division[] => {
  // First, group teams by league and stage
  const groupedTeams = data.reduce<Record<string, BackendTeamStats[]>>(
    (acc, team) => {
      // Create a unique key for each league-stage combination
      const key = `${team.league_name}|${team.stage}`;
      // Initialize the array if it doesn't exist
      if (!acc[key]) {
        acc[key] = [];
      }
      // At this point TypeScript knows acc[key] exists because we just initialized it
      acc[key]!.push(team);
      return acc;
    },
    {}
  );

  // Sort teams within each group by kana rating and limit to top 5
  Object.entries(groupedTeams).forEach(([_, teams]) => {
    teams.sort((a, b) => b.kana - a.kana);
    teams.splice(5); // Keep only top 5 teams
  });

  // Transform each league-stage group into a Division
  return (
    Object.entries(groupedTeams)
      .map(([key, teams]) => {
        const [leagueName, stageStr] = key.split("|");
        if (!leagueName || !stageStr) {
          throw new Error("Invalid league name or stage in data");
        }
        const stage = Number(stageStr);
        const stageType = getStageType(stage);

        return {
          title: formatDivisionTitle(leagueName, stageType),
          type: stageType,
          emoji: getLeagueEmoji(leagueName),
          teams: teams.map((team, index) => ({
            name: team.team_name,
            logo: team.team_logo,
            kana: team.kana,
            matches: team.matches_played,
            rank: index + 1
          }))
        };
      })
      // Sort divisions to ensure consistent order
      .sort((a, b) => {
        // First compare league names - ensure we have valid titles
        const aParts = a.title.split(",");
        const bParts = b.title.split(",");

        // Get league names, defaulting to empty string if undefined
        const aLeague = (aParts[0] || "").trim();
        const bLeague = (bParts[0] || "").trim();

        // Helper function to get league priority
        const getLeaguePriority = (league: string): number => {
          const lower = league.toLowerCase();
          if (lower === "masters") return 1;
          if (lower === "challengers") return 2;
          if (lower === "prospects") return 3;
          // Extract division number for DIV leagues
          const divMatch = lower.match(/div(\d+)/);
          if (divMatch) {
            return Number(divMatch[1]) + 3; // Start after prospects
          }
          return 999; // Unknown leagues go last
        };

        const aPriority = getLeaguePriority(aLeague);
        const bPriority = getLeaguePriority(bLeague);

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // If same league, put Regular before Playoffs
        if (a.type === "Regular" && b.type === "Playoffs") return -1;
        if (a.type === "Playoffs" && b.type === "Regular") return 1;
        return 0;
      })
  );
};

export default function TopTeamsPage() {
  const searchParams = useSearchParams();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableLeagues, setAvailableLeagues] = useState<number[]>([]);

  const initialParams = useMemo(
    () => ({
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      maps: getParamArray(searchParams, "maps")
    }),
    [searchParams]
  );

  // Fetch available leagues on component mount
  useEffect(() => {
    const fetchAvailableLeagues = async () => {
      const response = await fetch(`${envConfig.API_URL}/api/v1/leagues`);
      if (!response.ok) throw new Error("Failed to fetch leagues");
      const data = (await response.json()) as League[];
      setAvailableLeagues(data.map((league) => league.id));
    };

    fetchAvailableLeagues();
  }, []);

  useEffect(() => {
    const fetchTopTeams = async () => {
      if (availableLeagues.length === 0) return; // Don't fetch until we have available leagues

      setIsLoading(true);
      try {
        const { seasons, leagues, stages, maps } = initialParams;

        // Build query parameters
        const params = new URLSearchParams();

        if (seasons.length > 0) {
          seasons.forEach((season) =>
            params.append("seasons", season.toString())
          );
        }

        if (leagues.length > 0) {
          leagues.forEach((league) =>
            params.append("leagues", league.toString())
          );
        }

        if (stages.length > 0) {
          stages.forEach((stage) => params.append("stages", stage.toString()));
        }

        if (maps.length > 0) {
          maps.forEach((gameId) => params.append("maps", gameId.toString()));
        }

        // Add available leagues to params
        availableLeagues.forEach((leagueId) =>
          params.append("availableLeagues", leagueId.toString())
        );

        const response = await fetch(`/api/topteams?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch top teams");

        const data = await response.json();
        const transformedData = transformBackendData(data);
        setDivisions(transformedData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopTeams();
  }, [initialParams, availableLeagues]);

  if (isLoading) {
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
            <h1 className="text-3xl font-bold text-kanaliiga-orange py-8">
              Top Teams
            </h1>
            <div className="text-white text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-kanaliiga-orange py-8">
            Top Teams
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {divisions.map((division, index) => (
              <div key={index} className="bg-card rounded-sm overflow-hidden">
                <div className="bg-[#2a1810] p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{division.emoji}</span>
                    <div>
                      <h2 className="text-kanaliiga-orange text-xl font-bold">
                        {division.title}
                      </h2>
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
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className={`flex-shrink-0 w-6 text-center ${
                            teamIndex === 0
                              ? "text-yellow-400 font-bold"
                              : teamIndex === 1
                                ? "text-muted-foreground font-bold"
                                : teamIndex === 2
                                  ? "text-amber-700 font-bold"
                                  : "text-muted-foreground"
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

                        <div className="flex items-center gap-2 min-w-0">
                          {team.logo && (
                            <Image
                              src={team.logo}
                              alt={`${team.name} logo`}
                              width={20}
                              height={20}
                              className="rounded-full flex-shrink-0"
                            />
                          )}
                          <div className="truncate">
                            <span
                              className={`${
                                teamIndex < 3
                                  ? "font-bold text-white"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {team.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-muted-foreground text-sm hidden sm:inline">
                          {team.matches} matches
                        </span>
                        <span
                          className={`w-16 text-right ${
                            teamIndex < 3
                              ? "font-bold text-white"
                              : "text-muted-foreground"
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
