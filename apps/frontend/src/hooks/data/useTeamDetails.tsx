"use client";

import { useState, useEffect } from "react";
import type { Nullable } from "@eggosystem/types";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
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
/* 
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
*/

export interface TeamMatch {
  match_id: number;
  date: string;
  team_id: number;
  team_name: string;
  team_logo: string;
  opponent_id: number;
  opponent_name: string;
  opponent_logo: string;
  team_score: number;
  opponent_score: number;
  maps: string;
  result: string;
}

export interface TeamMapStats {
  map_id: number;
  map_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  avg_score: string;
  avg_opponent_score: string;
  avg_rating: string;
}

export interface TeamDetails {
  team: TeamStats;
  players: TeamPlayerStats[];
  matches: TeamMatch[];
  map_stats?: TeamMapStats[];
}

// Mock data for testing until API is implemented
/*
const MOCK_TEAM_DETAILS: { [key: number]: MockTeamDetails } = {
  // Rest of mock data definitions
};
*/

interface UseTeamDetailsProps {
  teamId: number | string;
  map_ids: Nullable<number[]>;
}

export const useTeamDetails = ({ teamId, map_ids }: UseTeamDetailsProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();

    if (map_ids) {
      map_ids.forEach((id) => params.append("map_ids", id.toString()));
    }

    setUrl(`/api/v1/teams/${teamId}?${params.toString()}`);
  }, [teamId, map_ids]);

  const { data, error, isValidating } = useSWR<TeamDetails>(
    url,
    expressFetcher,
    {
      revalidateOnFocus: false,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 3000);
      }
    }
  );

  return {
    teamDetails: data,
    isLoading: !error && !data,
    error,
    isValidating
  };
};
