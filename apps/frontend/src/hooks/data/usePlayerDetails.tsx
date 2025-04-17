"use client";

import { envConfig } from "@/configs/env";
import { generateFiltersParamQuery, type FilterParamsQuery } from "@/lib/utils";
import useSWR from "swr";
import type { Nullable } from "@eggosystem/types";

// Types based on the backend response
export interface PlayerDetails {
  playerStats: {
    steam_id: string;
    nickname: string;
    team_name: string;
    team_logo: string;
    matches_played: number;
    kills: number;
    assists: number;
    deaths: number;
    flash_assists: number;
    awp_kills: number;
    utility_damage: number;
    headshots: number;
    first_kills: number;
    first_deaths: number;
    adr: number;
    kana_rating: number;
    hs_percent: number;
    clutches_won: number;
    clutches_lost: number;
    kast: number;
    enemies_flashed: number;
    mates_flashed: number;
    self_flashes: number;
    total_damage: number;
    flashes_thrown: number;
    total_ef_duration: number;
    kd: number;
    wins: number;
    losses: number;
    draws: number;
    multikill_2k: number;
    multikill_3k: number;
    multikill_4k: number;
    multikill_5k: number;
    rounds_played: number;
  };
  matchHistory: Array<{
    match_id: string;
    game_id: string;
    map_id: number;
    map_name: string;
    season_id: number;
    season_name: string;
    league_id: number;
    league_name: string;
    stage: number;
    match_date: string;
    team_id: number;
    team_name: string;
    team_logo: string;
    score: number;
    opponent_id: number;
    opponent_name: string;
    opponent_logo: string;
    opponent_score: number;
    kills: number;
    deaths: number;
    assists: number;
    flash_assists: number;
    awp_kills: number;
    utility_damage: number;
    headshots: number;
    first_kills: number;
    first_deaths: number;
    kast: number;
    adr: number;
    hs_percent: number;
    kana_rating: number;
    kd: number;
  }>;
}

interface UsePlayerDetailsProps {
  steamId: string;
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

export const usePlayerDetails = ({
  steamId,
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
}: UsePlayerDetailsProps) => {
  const params: FilterParamsQuery = {
    seasons: season_ids || [],
    leagues: league_ids || [],
    teams: team_ids || [],
    stages: stages || [],
    maps: map_ids || []
  };

  const sortedQuery = generateFiltersParamQuery(params);
  const apiUrl = `/api/v1/players/${steamId}/statistics?${sortedQuery}`;

  console.log("Player details filter params:", params);

  const { data, error, isValidating } = useSWR<PlayerDetails>(
    apiUrl,
    directBackendFetcher,
    {
      revalidateOnFocus: false
    }
  );

  console.log("Player details received:", data);
  if (error) console.error("Player details error:", error);

  return {
    playerDetails: data,
    isLoading: !error && !data,
    isError: error,
    isValidating
  };
};
