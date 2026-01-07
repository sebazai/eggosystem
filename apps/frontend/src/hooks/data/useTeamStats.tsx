"use client";

import { expressFetcher } from "@/lib/utils";
import type { TeamStatsResponse } from "@eggosystem/types";
import useSWR from "swr";

interface UseTeamStatsParams {
  matchId?: number;
  matchGameId?: number;
}

export function useTeamStats({ matchId, matchGameId }: UseTeamStatsParams) {
  // Determine which endpoint to use based on provided params
  const endpoint = matchGameId
    ? `/api/v1/match-games/${matchGameId}/teamstats`
    : matchId
      ? `/api/v1/matches/${matchId}/teamstats`
      : null;

  const { data, error, isValidating } = useSWR<TeamStatsResponse[]>(
    endpoint,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamStats: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
}
