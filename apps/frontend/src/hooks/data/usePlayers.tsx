"use client";

import { generateFiltersParamQuery, type FilterParamsQuery } from "@/lib/utils";
import { envConfig } from "@/configs/env";
import useSWR from "swr";
import type { Nullable } from "@eggosystem/types";

export interface PlayerStats {
  steam_id: string;
  nickname: string;
  team_name: string; // Team name only, not logo
  matches_played: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  awp_kills: number;
  utility_damage: number;
  headshots: number;
  first_kills: number;
  first_deaths: number;
  adr: number;
  kana_rating: number;
  hs_percent: number;
  kd: number;
}

interface UsePlayersProps {
  season_ids: Nullable<number[]>;
  league_ids: Nullable<number[]>;
  team_ids: Nullable<number[]>;
  stages: Nullable<number[]>;
  map_ids: Nullable<number[]>;
}

// Custom fetcher that directly talks to the backend
const directBackendFetcher = async (url: string) => {
  const baseUrl = envConfig.API_URL;
  const fullUrl = `${baseUrl}${url}`;
  console.log(`Directly fetching from: ${fullUrl}`);

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

export const usePlayers = ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
}: UsePlayersProps) => {
  const params: FilterParamsQuery = {
    seasons: season_ids || [],
    leagues: league_ids || [],
    teams: team_ids || [],
    stages: stages || [],
    maps: map_ids || []
  };

  const sortedQuery = generateFiltersParamQuery(params);

  console.log("Player filter params:", params);

  const { data, error, isValidating } = useSWR<PlayerStats[]>(
    `/api/v1/players/stats?${sortedQuery}`,
    directBackendFetcher,
    {
      revalidateOnFocus: false
    }
  );

  console.log("Player data received:", data);
  if (error) console.error("Player data error:", error);

  return {
    players: data || [],
    isLoading: !error && !data,
    isError: error,
    isValidating
  };
};
