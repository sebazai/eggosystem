"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchMapsPlayed } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchMaps = (matchId: number) => {
  const { data, error, isValidating } = useSWR<MatchMapsPlayed[]>(
    `/api/v1/matches/${matchId}/mapsplayed`,
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
