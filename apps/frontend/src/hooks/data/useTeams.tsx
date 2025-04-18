"use client";

import { useState, useEffect } from "react";
import type { Nullable } from "@eggosystem/types";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

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

interface UseTeamsProps {
  season_ids: Nullable<number[]>;
  league_ids: Nullable<number[]>;
  team_ids?: Nullable<number[]>;
  useMockData?: boolean;
}

export const useTeams = ({
  season_ids,
  league_ids,
  team_ids,
  useMockData = false
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

    setUrl(`/api/v1/teams/filtered?${params.toString()}`);
  }, [season_ids, league_ids, team_ids]);

  // Use SWR to fetch data from the backend
  const { data, error, isValidating } = useSWR<TeamStats[]>(
    useMockData ? null : url, // Skip fetch if using mock data
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
    teams: data || [],
    isLoading: !useMockData && !error && !data,
    error: error,
    isValidating
  };
};
