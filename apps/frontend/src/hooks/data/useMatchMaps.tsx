"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchMapsPlayed } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchMaps = (matchId: number | undefined) => {
  const { data, error, isValidating } = useSWR<MatchMapsPlayed[]>(
    matchId ? `/api/v1/matches/${matchId}/mapsplayed` : null,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    maps: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
