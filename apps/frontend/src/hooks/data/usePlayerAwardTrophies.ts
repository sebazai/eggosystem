"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { TrophiesResponse } from "@eggosystem/types";

/**
 * Hook to fetch trophy assignments for a player
 */
export const usePlayerAwardTrophies = (steamId: string) => {
  return useSWR<TrophiesResponse>(
    steamId ? `/api/v1/players/${steamId}/trophies` : null,
    expressFetcher
  );
};
