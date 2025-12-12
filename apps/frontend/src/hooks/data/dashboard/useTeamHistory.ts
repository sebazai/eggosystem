"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { TeamHistoricalPerformance } from "@eggosystem/types";

/**
 * Hook to fetch historical performance for a team
 * Finds previous seasons where 4+ of the team's registered players played together
 */
export function useTeamHistory(seasonId: number | null, teamId: number | null) {
  const { data, error, isLoading, isValidating } = useSWR<
    TeamHistoricalPerformance[]
  >(
    seasonId && teamId
      ? `/api/v1/dashboard/sortter/season/${seasonId}/team/${teamId}/history`
      : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    history: data || [],
    isLoading,
    isValidating,
    error
  };
}
