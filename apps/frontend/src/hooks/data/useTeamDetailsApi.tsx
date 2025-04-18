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

export interface TeamMatch {
  id: number;
  date: string;
  opponent_id: number;
  opponent_name: string;
  opponent_logo: string;
  team_score: number;
  opponent_score: number;
  map_id: number;
  map_name: string;
  result: string;
}

export interface TeamDetails {
  team: TeamStats;
  players: TeamPlayerStats[];
  matches: TeamMatch[];
}

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
