"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { TrophiesResponse } from "@eggosystem/types";

/**
 * Hook to fetch trophy assignments for a team
 */
export const useTeamTrophies = (teamId: number | null) => {
  return useSWR<TrophiesResponse>(
    teamId ? `/api/v1/teams/${teamId}/trophies` : null,
    expressFetcher
  );
};
