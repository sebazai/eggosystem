"use client";

import { useState, useEffect } from "react";
import type { Nullable } from "@eggosystem/types";

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

export interface TeamStats {
  id: number;
  name: string;
  team_logo: string;
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  win_percentage: number;
  league_name: string;
  league_id: number;
  season_id: number;
  season_name: string;
}

// Mock data for testing until API is implemented
export const MOCK_TEAMS: TeamStats[] = [
  {
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
  {
    id: 2,
    name: "Accenture Elite",
    team_logo: "/teams/nologo.svg",
    matches_played: 10,
    wins: 5,
    losses: 5,
    ties: 0,
    win_percentage: 50.0,
    league_name: "CS2 S2: Masters",
    league_id: 102,
    season_id: 5,
    season_name: "CS2 Season 2"
  },
  {
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
  {
    id: 4,
    name: "CSKeisari",
    team_logo: "/teams/nologo.svg",
    matches_played: 12,
    wins: 7,
    losses: 4,
    ties: 1,
    win_percentage: 62.5,
    league_name: "CS2 S2: Masters",
    league_id: 102,
    season_id: 5,
    season_name: "CS2 Season 2"
  },
  {
    id: 5,
    name: "Sortter Gaming",
    team_logo: "/teams/nologo.svg",
    matches_played: 12,
    wins: 6,
    losses: 6,
    ties: 0,
    win_percentage: 50.0,
    league_name: "CS2 S2: div5",
    league_id: 105,
    season_id: 5,
    season_name: "CS2 Season 2"
  },
  {
    id: 6,
    name: "Small Giant Strikers",
    team_logo: "/teams/nologo.svg",
    matches_played: 10,
    wins: 3,
    losses: 7,
    ties: 0,
    win_percentage: 30.0,
    league_name: "CS2 S2: div4",
    league_id: 104,
    season_id: 5,
    season_name: "CS2 Season 2"
  },
  {
    id: 7,
    name: "Elenia",
    team_logo: "/teams/nologo.svg",
    matches_played: 8,
    wins: 1,
    losses: 7,
    ties: 0,
    win_percentage: 12.5,
    league_name: "CS2 S2: div4",
    league_id: 104,
    season_id: 5,
    season_name: "CS2 Season 2"
  },
  {
    id: 8,
    name: "IBM Perinteinen Plan B",
    team_logo: "/teams/nologo.svg",
    matches_played: 14,
    wins: 8,
    losses: 5,
    ties: 1,
    win_percentage: 60.7,
    league_name: "CS2 S2: div6",
    league_id: 106,
    season_id: 5,
    season_name: "CS2 Season 2"
  },
  {
    id: 9,
    name: "Symbio Finland",
    team_logo: "/teams/nologo.svg",
    matches_played: 12,
    wins: 9,
    losses: 3,
    ties: 0,
    win_percentage: 75.0,
    league_name: "CS2 S2: div4",
    league_id: 104,
    season_id: 5,
    season_name: "CS2 Season 2"
  },
  {
    id: 10,
    name: "Triplan eSports",
    team_logo: "/teams/nologo.svg",
    matches_played: 12,
    wins: 7,
    losses: 4,
    ties: 1,
    win_percentage: 62.5,
    league_name: "CS2 S2: div3",
    league_id: 103,
    season_id: 5,
    season_name: "CS2 Season 2"
  }
];

interface UseTeamsProps {
  season_ids: Nullable<number[]>;
  league_ids: Nullable<number[]>;
  team_ids?: Nullable<number[]>;
}

export const useTeams = ({
  season_ids,
  league_ids,
  team_ids
}: UseTeamsProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();

    if (season_ids) {
      season_ids.forEach((id) => params.append("season_ids", id.toString()));
    }

    if (league_ids) {
      league_ids.forEach((id) => params.append("league_ids", id.toString()));
    }

    if (team_ids) {
      team_ids.forEach((id) => params.append("team_ids", id.toString()));
    }

    setUrl(`/api/teams?${params.toString()}`);
  }, [season_ids, league_ids, team_ids]);

  // Simplified approach for mock data
  const { data, isLoading, error } = useQuery<TeamStats[]>({
    queryKey: ["teams", url],
    queryFn: async () => {
      // Filter the mock data based on the provided filters
      return MOCK_TEAMS.filter((team) => {
        const matchesSeason =
          !season_ids?.length || season_ids.includes(team.season_id);
        const matchesLeague =
          !league_ids?.length || league_ids.includes(team.league_id);
        const matchesTeam = !team_ids?.length || team_ids.includes(team.id);
        return matchesSeason && matchesLeague && matchesTeam;
      });
    }
  });

  return {
    teams: data || [],
    isLoading,
    error
  };
};
