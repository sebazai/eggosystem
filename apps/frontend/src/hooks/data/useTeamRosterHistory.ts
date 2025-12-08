import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { RosterHistoryResponse } from "@eggosystem/types";

/**
 * Fetch roster history for a team across all seasons
 * Used to pre-populate signup form with players from previous seasons
 */
export const useTeamRosterHistory = (teamId: number | undefined) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    teamId ? `/api/v1/teams/${teamId}/roster-history` : null,
    clientApiFetch<RosterHistoryResponse>
  );

  return {
    rosterHistory: data,
    isLoading,
    isError: error,
    isValidating,
    mutate
  };
};
