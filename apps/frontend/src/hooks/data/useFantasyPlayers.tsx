"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

export interface FantasyPlayerStats {
  steam_id: string;
  nickname: string;
  team_id: number;
  team_name: string;
  team_logo: string | null;
  kana_rating: number;
  kd: number;
  kills: number;
  deaths: number;
  adr: number | null;
  maps_played: number;
}

export const useFantasyPlayers = (seasonId: string, leagueId: string | null) => {
  const { data, error, isValidating, isLoading } = useSWR<
    FantasyPlayerStats[],
    Error
  >(
    leagueId ? `/api/v1/seasons/${seasonId}/fantasy/leagues/${leagueId}/players` : null,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    players: data,
    isLoading,
    isError: error,
    isValidating
  };
};

