"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchMapsPlayed } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchMaps = (matchId: string) => {
  const { data, error, isValidating } = useSWR<MatchMapsPlayed[]>(
    `/api/v1/matches/${matchId}/mapsplayed`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  // Format map names: remove "de_" prefix and capitalize
  const formattedMaps = data?.map((map) => ({
    ...map,
    map_name: map.map_name.replace("de_", "").toUpperCase()
  }));

  return {
    maps: formattedMaps,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
