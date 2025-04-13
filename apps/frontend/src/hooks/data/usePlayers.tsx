"use client";

import { useState, useEffect } from "react";
import type { Nullable } from "@eggosystem/types";

// Mock implementation of react-query
const useQuery = <T,>({
  queryFn,
  enabled = true
}: {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
}) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await queryFn();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [queryFn, enabled]);

  return { data, isLoading };
};

export interface PlayerStats {
  nickname: string;
  team_name: string;
  team_logo: string;
  matches_played: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  awp_kills: number;
  total_damage: number;
  headshots: number;
  enemies_flashed: number;
  mates_flashed: number;
  first_kills: number;
  first_deaths: number;
  utility_damage: number;
  adr: number;
  kana_rating: number;
  hs_percent: number;
  kd: number;
}

// Mock data for testing until API is implemented
const MOCK_PLAYERS: PlayerStats[] = [
  {
    nickname: ".Ville",
    team_name: "Avarn Senior",
    team_logo: "/teams/nologo.svg",
    matches_played: 17,
    kills: 253,
    deaths: 252,
    assists: 95,
    flash_assists: 22,
    awp_kills: 12,
    total_damage: 27902,
    headshots: 131,
    enemies_flashed: 165,
    mates_flashed: 216,
    first_kills: 30,
    first_deaths: 25,
    utility_damage: 1245,
    adr: 80.1,
    kana_rating: 1.05,
    hs_percent: 51.8,
    kd: 1.0
  },
  {
    nickname: "[h]BeArBoY",
    team_name: "Accenture Elite",
    team_logo: "/teams/nologo.svg",
    matches_played: 10,
    kills: 111,
    deaths: 131,
    assists: 43,
    flash_assists: 12,
    awp_kills: 2,
    total_damage: 11682,
    headshots: 55,
    enemies_flashed: 33,
    mates_flashed: 26,
    first_kills: 10,
    first_deaths: 18,
    utility_damage: 425,
    adr: 55.8,
    kana_rating: 0.85,
    hs_percent: 49.5,
    kd: 0.85
  },
  {
    nickname: "✧ SATAnic addict fish ✧",
    team_name: "Vaisala Esports",
    team_logo: "/teams/nologo.svg",
    matches_played: 22,
    kills: 505,
    deaths: 308,
    assists: 97,
    flash_assists: 30,
    awp_kills: 122,
    total_damage: 51003,
    headshots: 170,
    enemies_flashed: 190,
    mates_flashed: 220,
    first_kills: 78,
    first_deaths: 34,
    utility_damage: 1890,
    adr: 105.9,
    kana_rating: 1.35,
    hs_percent: 33.7,
    kd: 1.64
  },
  {
    nickname: "Obror",
    team_name: "CSKeisari",
    team_logo: "/teams/nologo.svg",
    matches_played: 14,
    kills: 214,
    deaths: 197,
    assists: 56,
    flash_assists: 18,
    awp_kills: 8,
    total_damage: 23697,
    headshots: 102,
    enemies_flashed: 139,
    mates_flashed: 137,
    first_kills: 28,
    first_deaths: 22,
    utility_damage: 985,
    adr: 81.6,
    kana_rating: 1.02,
    hs_percent: 47.7,
    kd: 1.09
  },
  {
    nickname: "1sin",
    team_name: "Sortter Gaming",
    team_logo: "/teams/nologo.svg",
    matches_played: 18,
    kills: 355,
    deaths: 269,
    assists: 97,
    flash_assists: 26,
    awp_kills: 85,
    total_damage: 39916,
    headshots: 101,
    enemies_flashed: 109,
    mates_flashed: 97,
    first_kills: 52,
    first_deaths: 30,
    utility_damage: 1430,
    adr: 107.0,
    kana_rating: 1.25,
    hs_percent: 28.5,
    kd: 1.32
  },
  {
    nickname: "4P3X",
    team_name: "Small Giant Strikers",
    team_logo: "/teams/nologo.svg",
    matches_played: 15,
    kills: 207,
    deaths: 218,
    assists: 62,
    flash_assists: 15,
    awp_kills: 0,
    total_damage: 21347,
    headshots: 71,
    enemies_flashed: 23,
    mates_flashed: 22,
    first_kills: 18,
    first_deaths: 25,
    utility_damage: 745,
    adr: 65.8,
    kana_rating: 0.93,
    hs_percent: 34.3,
    kd: 0.95
  },
  {
    nickname: "A$AP Tofi",
    team_name: "Symbio Finland",
    team_logo: "/teams/nologo.svg",
    matches_played: 12,
    kills: 244,
    deaths: 187,
    assists: 69,
    flash_assists: 20,
    awp_kills: 56,
    total_damage: 25808,
    headshots: 80,
    enemies_flashed: 96,
    mates_flashed: 123,
    first_kills: 35,
    first_deaths: 22,
    utility_damage: 940,
    adr: 104.1,
    kana_rating: 1.18,
    hs_percent: 32.8,
    kd: 1.31
  }
];

interface UsePlayersProps {
  season_ids: Nullable<number[]>;
  league_ids: Nullable<number[]>;
  team_ids: Nullable<number[]>;
  stages: Nullable<number[]>;
  map_ids: Nullable<number[]>;
}

export const usePlayers = ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
}: UsePlayersProps) => {
  // We keep this for when the real API is implemented
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();

    if (season_ids) {
      season_ids.forEach((id) => params.append("season_ids", id.toString()));
    }

    if (league_ids) {
      league_ids.forEach((id) => params.append("league_ids", id.toString()));
    }

    if (team_ids) {
      team_ids.forEach((id) => params.append("team_ids", id.toString()));
    }

    if (stages) {
      stages.forEach((id) => params.append("stages", id.toString()));
    }

    if (map_ids) {
      map_ids.forEach((id) => params.append("map_ids", id.toString()));
    }

    // Mock API URL - will be replaced with real API URL later
    setUrl(`/api/players?${params.toString()}`);
  }, [season_ids, league_ids, team_ids, stages, map_ids]);

  // For now, use mock data with a delay to simulate API call
  const { data, isLoading } = useQuery<PlayerStats[]>({
    queryKey: ["players", url],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_PLAYERS;
    },
    enabled: true, // Always enabled for mock data
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return {
    players: data || [],
    isLoading,
    error: null
  };
};
