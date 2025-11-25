"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

export interface MyFantasyTeam {
  team_id: number;
  team_name: string;
  league_id: number;
  steam_id?: string; // User's steam_id (owner of the team)
  total_points: number;
  budget_remaining: number;
  remaining_role_swaps?: number;
  remaining_substitutions?: number;
  current_week_number?: number;
  players: {
    id: number; // fantasy_team_player_id
    steam_id: string;
    nickname: string;
    team_name: string | null;
    team_logo: string | null;
    role: string | null;
    player_value: number;
    tier?: "bronze" | "silver" | "gold";
    points_earned: number;
    individual_points: number;
    team_points: number;
    role_points: number;
    kana_rating: number | null;
    kills: number | null;
    deaths: number | null;
    kd: number | null;
    adr: number | null;
    adr_t: number | null;
    adr_ct: number | null;
    headshots: number | null;
    headshot_percentage: number | null;
    flash_assists: number | null;
    first_kills: number | null;
    first_deaths: number | null;
    kast: number | null;
    has_played_this_week?: boolean; // Whether player has played matches in current week
  }[];
}

// Authenticated fetcher that includes credentials for protected endpoints
const authenticatedFetcher = <T,>(url: string): Promise<T> =>
  expressFetcher<T>(url, { credentials: "include" });

export function useMyFantasyTeam(seasonId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MyFantasyTeam>(
    seasonId ? `/api/v1/seasons/${seasonId}/fantasy/teams/me` : null,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false // Don't retry on 404 (user has no team)
    }
  );

  return {
    team: data,
    isLoading,
    error,
    mutate
  };
}
