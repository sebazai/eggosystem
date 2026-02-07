"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { PlayerSortterValues } from "@eggosystem/types";

export interface LivePlayerValues extends PlayerSortterValues {
  role: "primary" | "substitute";
  is_captain: boolean;
  is_co_captain: boolean;
  match_id: number | null;
  match_info: string | null;
}

/**
 * Hook to fetch live team player data from SeasonTeamPlayers table
 * This shows current players including those added after sortter finalization
 *
 * @param seasonId The season ID
 * @param teamId The team ID
 * @returns Player values with role information
 */
export function useTeamPlayersLive(
  seasonId: number | null,
  teamId: number | null
): {
  players: LivePlayerValues[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  isError: unknown;
  mutate: () => Promise<LivePlayerValues[] | undefined>;
} {
  const key =
    seasonId && teamId
      ? `/api/v1/dashboard/teams/season/${seasonId}/team/${teamId}/players`
      : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    LivePlayerValues[]
  >(key, clientApiFetch, {
    revalidateOnFocus: false,
    revalidateOnMount: true
  });

  return {
    players: data,
    isLoading,
    isValidating,
    isError: error,
    mutate
  };
}
