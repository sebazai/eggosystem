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

export interface MatchMapVetoWithMapName {
  id: number;
  match_id: number;
  team_id: number;
  map_id: number;
  map_name: string;
  action: "drop" | "pick" | "decider";
  veto_order: number;
  opponent_start: "CT" | "T" | null;
}

export const useMatchVetoes = (matchId: number) => {
  const { data, error, isValidating } = useSWR<MatchMapVetoWithMapName[]>(
    `/api/v1/matches/${matchId}/vetoes`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    vetoes: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
