"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";

interface Team {
  team_id: number;
  team_name: string;
  league_name: string;
}

export const useTeamsBySeasonForAddPlayer = (
  seasonId: string | number | null
) => {
  const apiUrl = seasonId
    ? `/api/v1/dashboard/sortter/season/${seasonId}/teams-for-add-player`
    : null;

  const { data, error, isValidating, isLoading } = useSWR<Team[]>(
    apiUrl,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teams: data,
    isLoading,
    isError: error,
    isValidating
  };
};
