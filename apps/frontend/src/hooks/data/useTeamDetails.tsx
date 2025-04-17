"use client";

import { useState, useEffect } from "react";
import type { Nullable } from "@eggosystem/types";
import { type PlayerStats } from "@/hooks/data/usePlayers";
import { type TeamStats } from "@/hooks/data/useTeams";

// Extend PlayerStats to include team_logo for the team details page
export interface TeamPlayerStats extends PlayerStats {
  team_logo?: string;
  total_damage?: number;
  enemies_flashed?: number;
  mates_flashed?: number;
}

// Define a separate interface for mock data to avoid type conflicts
export interface MockPlayerStats {
  steam_id?: string;
  nickname: string;
  team_name: string;
  team_logo: string;
  matches_played: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  awp_kills: number;
  total_damage: number;
  headshots: number;
  enemies_flashed: number;
  mates_flashed: number;
  first_kills: number;
  first_deaths: number;
  utility_damage: number;
  adr: number;
  kana_rating: number;
  hs_percent: number;
  kd: number;
}

export interface MockTeamDetails {
  team: TeamStats;
  players: MockPlayerStats[];
  matches: TeamMatch[];
}

// Very simple query hook for mock data
const useQuery = <T,>({
  queryFn
}: {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
}) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Remove delay for now to troubleshoot
        const result = await queryFn();
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // We only want this to run once for mock data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, isLoading, error };
};

export interface TeamMatch {
  id: string;
  date: string;
  opponent_name: string;
  opponent_logo: string;
  team_score: number;
  opponent_score: number;
  map_id: number;
  map_name: string;
  result: "win" | "loss" | "tie";
}

export interface TeamDetails {
  team: TeamStats;
  players: TeamPlayerStats[];
  matches: TeamMatch[];
}

// Mock data for testing until API is implemented
const MOCK_TEAM_DETAILS: { [key: number]: MockTeamDetails } = {
  1: {
    team: {
      id: 1,
      name: "Avarn Senior",
      team_logo: "/teams/nologo.svg",
      matches_played: 12,
      wins: 8,
      losses: 3,
      ties: 1,
      win_percentage: 70.8,
      league_name: "CS2 S2: div2",
      league_id: 101,
      season_id: 5,
      season_name: "CS2 Season 2"
    },
    players: [
      {
        steam_id: "76561197967885016",
        nickname: ".Ville",
        team_name: "Avarn Senior",
        team_logo: "/teams/nologo.svg",
        matches_played: 17,
        kills: 253,
        deaths: 252,
        assists: 95,
        flash_assists: 22,
        awp_kills: 12,
        headshots: 131,
        first_kills: 30,
        first_deaths: 25,
        utility_damage: 1245,
        total_damage: 1361,
        enemies_flashed: 18,
        mates_flashed: 6,
        adr: 80.1,
        kana_rating: 1.05,
        hs_percent: 51.8,
        kd: 1.0
      },
      {
        steam_id: "76561198043033465",
        nickname: "Player2",
        team_name: "Avarn Senior",
        team_logo: "/teams/nologo.svg",
        matches_played: 15,
        kills: 225,
        deaths: 210,
        assists: 82,
        flash_assists: 18,
        awp_kills: 5,
        headshots: 110,
        first_kills: 25,
        first_deaths: 22,
        utility_damage: 1050,
        total_damage: 1137,
        enemies_flashed: 14,
        mates_flashed: 8,
        adr: 75.8,
        kana_rating: 0.98,
        hs_percent: 48.9,
        kd: 1.07
      },
      {
        steam_id: "76561198049745649",
        nickname: "Player3",
        team_name: "Avarn Senior",
        team_logo: "/teams/nologo.svg",
        matches_played: 16,
        kills: 240,
        deaths: 230,
        assists: 90,
        flash_assists: 20,
        awp_kills: 8,
        headshots: 120,
        first_kills: 28,
        first_deaths: 24,
        utility_damage: 1150,
        total_damage: 1254,
        enemies_flashed: 16,
        mates_flashed: 7,
        adr: 78.4,
        kana_rating: 1.01,
        hs_percent: 50.0,
        kd: 1.04
      }
    ],
    matches: [
      {
        id: "match1",
        date: "2023-06-01",
        opponent_name: "Accenture Elite",
        opponent_logo: "/teams/nologo.svg",
        team_score: 16,
        opponent_score: 14,
        map_id: 1,
        map_name: "Dust2",
        result: "win"
      },
      {
        id: "match2",
        date: "2023-06-08",
        opponent_name: "CSKeisari",
        opponent_logo: "/teams/nologo.svg",
        team_score: 13,
        opponent_score: 16,
        map_id: 2,
        map_name: "Inferno",
        result: "loss"
      },
      {
        id: "match3",
        date: "2023-06-15",
        opponent_name: "Elenia",
        opponent_logo: "/teams/nologo.svg",
        team_score: 16,
        opponent_score: 7,
        map_id: 3,
        map_name: "Mirage",
        result: "win"
      },
      {
        id: "match4",
        date: "2023-06-22",
        opponent_name: "Vaisala Esports",
        opponent_logo: "/teams/nologo.svg",
        team_score: 15,
        opponent_score: 15,
        map_id: 4,
        map_name: "Nuke",
        result: "tie"
      }
    ]
  },
  3: {
    team: {
      id: 3,
      name: "Vaisala Esports",
      team_logo: "/teams/nologo.svg",
      matches_played: 14,
      wins: 11,
      losses: 3,
      ties: 0,
      win_percentage: 78.6,
      league_name: "CS2 S2: div4",
      league_id: 104,
      season_id: 5,
      season_name: "CS2 Season 2"
    },
    players: [
      {
        steam_id: "76561197967885016",
        nickname: "✧ SATAnic addict fish ✧",
        team_name: "Vaisala Esports",
        team_logo: "/teams/nologo.svg",
        matches_played: 22,
        kills: 505,
        deaths: 308,
        assists: 97,
        flash_assists: 30,
        awp_kills: 122,
        headshots: 170,
        first_kills: 78,
        first_deaths: 34,
        utility_damage: 1890,
        total_damage: 2329,
        enemies_flashed: 42,
        mates_flashed: 12,
        adr: 105.9,
        kana_rating: 1.35,
        hs_percent: 33.7,
        kd: 1.64
      }
    ],
    matches: [
      {
        id: "match5",
        date: "2023-06-05",
        opponent_name: "Elenia",
        opponent_logo: "/teams/nologo.svg",
        team_score: 16,
        opponent_score: 8,
        map_id: 1,
        map_name: "Dust2",
        result: "win"
      },
      {
        id: "match6",
        date: "2023-06-12",
        opponent_name: "Small Giant Strikers",
        opponent_logo: "/teams/nologo.svg",
        team_score: 16,
        opponent_score: 10,
        map_id: 5,
        map_name: "Ancient",
        result: "win"
      }
    ]
  }
};

interface UseTeamDetailsProps {
  teamId: number | string;
  map_ids: Nullable<number[]>;
}

export const useTeamDetails = ({ teamId, map_ids }: UseTeamDetailsProps) => {
  // Simplified approach for mock data
  const { data, isLoading, error } = useQuery<TeamDetails | null>({
    queryKey: ["team", teamId, map_ids],
    queryFn: async () => {
      try {
        console.log("Fetching team details for ID:", teamId);

        // Handle case when teamId is not a valid number
        const teamIdNum = Number(teamId);
        if (isNaN(teamIdNum)) {
          console.error("Invalid team ID:", teamId);
          return null;
        }

        const teamDetails = MOCK_TEAM_DETAILS[teamIdNum];

        if (!teamDetails) {
          console.log("Team not found for ID:", teamIdNum);
          return null;
        }

        // Convert MockTeamDetails to TeamDetails
        const result: TeamDetails = {
          team: teamDetails.team,
          players: teamDetails.players.map((player) => ({
            steam_id: player.steam_id || "",
            nickname: player.nickname,
            team_name: player.team_name,
            team_logo: player.team_logo,
            matches_played: player.matches_played,
            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,
            flash_assists: player.flash_assists,
            awp_kills: player.awp_kills,
            headshots: player.headshots,
            first_kills: player.first_kills,
            first_deaths: player.first_deaths,
            utility_damage: player.utility_damage,
            adr: player.adr,
            kana_rating: player.kana_rating,
            hs_percent: player.hs_percent,
            kd: player.kd,
            total_damage: player.total_damage,
            enemies_flashed: player.enemies_flashed,
            mates_flashed: player.mates_flashed
          })),
          matches: teamDetails.matches
        };

        // Filter matches by map_id if provided
        if (map_ids && map_ids.length > 0) {
          return {
            ...result,
            matches: result.matches.filter((match) =>
              map_ids.includes(match.map_id)
            )
          };
        }

        return result;
      } catch (err) {
        console.error("Error in team details fetch:", err);
        throw err;
      }
    }
  });

  return {
    teamDetails: data,
    isLoading,
    error
  };
};
