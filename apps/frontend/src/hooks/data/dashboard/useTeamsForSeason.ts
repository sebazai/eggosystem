"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";

interface TeamForSeason {
  team_id: number;
  team_name: string;
  league_name: string;
  league_id: number;
}

export function useTeamsForSeason(seasonId: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<TeamForSeason[]>(
    seasonId ? `/api/v1/dashboard/seasons/${seasonId}/teams` : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teams: data || [],
    isLoading,
    isError: error,
    isValidating
  };
}
