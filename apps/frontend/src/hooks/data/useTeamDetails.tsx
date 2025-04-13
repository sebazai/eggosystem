"use client";

import { useState, useEffect } from "react";
import type { Nullable } from "@eggosystem/types";
import { type PlayerStats } from "@/hooks/data/usePlayers";
import { type TeamStats } from "@/hooks/data/useTeams";

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
  players: PlayerStats[];
  matches: TeamMatch[];
}

// Mock data for testing until API is implemented
const MOCK_TEAM_DETAILS: { [key: number]: TeamDetails } = {
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
        nickname: ".Ville",
        team_name: "Avarn Senior",
        team_logo: "/teams/nologo.svg",
        matches_played: 17,
        kills: 253,
        deaths: 252,
        assists: 95,
        flash_assists: 22,
        awp_kills: 12,
        total_damage: 27902,
        headshots: 131,
        enemies_flashed: 165,
        mates_flashed: 216,
        first_kills: 30,
        first_deaths: 25,
        utility_damage: 1245,
        adr: 80.1,
        kana_rating: 1.05,
        hs_percent: 51.8,
        kd: 1.0
      },
      {
        nickname: "Player2",
        team_name: "Avarn Senior",
        team_logo: "/teams/nologo.svg",
        matches_played: 15,
        kills: 225,
        deaths: 210,
        assists: 82,
        flash_assists: 18,
        awp_kills: 5,
        total_damage: 24560,
        headshots: 110,
        enemies_flashed: 145,
        mates_flashed: 180,
        first_kills: 25,
        first_deaths: 22,
        utility_damage: 1050,
        adr: 75.8,
        kana_rating: 0.98,
        hs_percent: 48.9,
        kd: 1.07
      },
      {
        nickname: "Player3",
        team_name: "Avarn Senior",
        team_logo: "/teams/nologo.svg",
        matches_played: 16,
        kills: 240,
        deaths: 230,
        assists: 90,
        flash_assists: 20,
        awp_kills: 8,
        total_damage: 26500,
        headshots: 120,
        enemies_flashed: 155,
        mates_flashed: 200,
        first_kills: 28,
        first_deaths: 24,
        utility_damage: 1150,
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
        nickname: "✧ SATAnic addict fish ✧",
        team_name: "Vaisala Esports",
        team_logo: "/teams/nologo.svg",
        matches_played: 22,
        kills: 505,
        deaths: 308,
        assists: 97,
        flash_assists: 30,
        awp_kills: 122,
        total_damage: 51003,
        headshots: 170,
        enemies_flashed: 190,
        mates_flashed: 220,
        first_kills: 78,
        first_deaths: 34,
        utility_damage: 1890,
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

        // Filter matches by map_id if provided
        if (map_ids && map_ids.length > 0) {
          return {
            ...teamDetails,
            matches: teamDetails.matches.filter((match) =>
              map_ids.includes(match.map_id)
            )
          };
        }

        return teamDetails;
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
