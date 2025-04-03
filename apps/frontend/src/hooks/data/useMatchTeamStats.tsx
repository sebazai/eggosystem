"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchTeamStats } from "@eggosystem/types";
import useSWR from "swr";

export function useMatchTeamStats(matchId: string) {
  const { data, error, isValidating } = useSWR<MatchTeamStats[]>(
    `/api/v1/matches/${matchId}/teamstats`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    teamStats: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
}
