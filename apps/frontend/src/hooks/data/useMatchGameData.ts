"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  GamePlayerStats,
  MapRoundInfo,
  MatchGameOpeningDuel,
  MatchGameTradeStats
} from "@eggosystem/types";

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  dedupingInterval: 5 * 60 * 1000
};

export function useMatchGamePlayerStats(matchGameId: number) {
  const { data, error, isLoading } = useSWR<GamePlayerStats[]>(
    `/api/v1/match-games/${matchGameId}/playerstats`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data ?? [], error, isLoading };
}

export function useMatchGameRoundInfo(matchGameId: number) {
  const { data, error, isLoading } = useSWR<MapRoundInfo[]>(
    `/api/v1/match-games/${matchGameId}/roundinfo`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data ?? [], error, isLoading };
}

export function useMatchGameOpeningDuels(matchGameId: number) {
  const { data, error, isLoading } = useSWR<MatchGameOpeningDuel[]>(
    `/api/v1/match-games/${matchGameId}/opening-duels`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data ?? [], error, isLoading };
}

export function useMatchGameTradeStats(matchGameId: number) {
  const { data, error, isLoading } = useSWR<MatchGameTradeStats>(
    `/api/v1/match-games/${matchGameId}/trade-stats`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data, error, isLoading };
}

export interface WeaponStat {
  weapon: string;
  kills: number;
  headshot_kills: number;
  total_damage: number;
  hits: number;
}

interface WeaponStatsResponse {
  weapons: WeaponStat[];
}

export function useMatchGameWeaponStats(matchGameId: number, steamId: string) {
  const { data, error, isLoading } = useSWR<WeaponStatsResponse>(
    `/api/v1/match-games/${matchGameId}/weapon-stats?steam_id=${steamId}`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data?.weapons ?? [], error, isLoading };
}

export interface HitGroupCount {
  hit_group: string;
  hits: number;
  damage: number;
}

export interface HitStats {
  dealt: HitGroupCount[];
  received: HitGroupCount[];
}

export function useMatchGameHitStats(matchGameId: number, steamId: string) {
  const { data, error, isLoading } = useSWR<HitStats>(
    `/api/v1/match-games/${matchGameId}/hit-stats?steam_id=${steamId}`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data ?? null, error, isLoading };
}

export interface RoundKillEvent {
  round_number: number;
  time_in_round: number;
  victim_nickname: string;
  weapon: string;
  is_headshot: boolean;
}

export interface RoundDeathEvent {
  round_number: number;
  time_in_round: number;
  killer_nickname: string;
  weapon: string;
  is_headshot: boolean;
}

export interface RoundFlashEvent {
  round_number: number;
  time_in_round: number;
  victim_nickname: string;
  duration_seconds: number;
  is_enemy_flash: boolean;
}

export interface RoundUtilityEvent {
  round_number: number;
  utility_damage: number;
  smokes_thrown: number;
  flashes_thrown: number;
  enemies_flashed: number;
  teammates_flashed: number;
}

export interface RoundWastedUtilityEvent {
  round_number: number;
  time_in_round: number;
  utility_type: string;
}

export interface RoundUtilityThrowEvent {
  round_number: number;
  time_in_round: number;
  utility_type: string;
}

export interface RoundUtilityDamageEvent {
  round_number: number;
  time_in_round: number;
  victim_nickname: string;
  weapon: string;
  health_damage: number;
  is_enemy_hit: boolean;
}

export interface PlayerRoundEvents {
  kills: RoundKillEvent[];
  deaths: RoundDeathEvent[];
  flashes: RoundFlashEvent[];
  utility: RoundUtilityEvent[];
  wasted: RoundWastedUtilityEvent[];
  utility_throws: RoundUtilityThrowEvent[];
  utility_damage_hits: RoundUtilityDamageEvent[];
}

export function useMatchGameRoundEvents(matchGameId: number, steamId: string) {
  const { data, error, isLoading } = useSWR<PlayerRoundEvents>(
    `/api/v1/match-games/${matchGameId}/round-events?steam_id=${steamId}`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return {
    data: data ?? {
      kills: [],
      deaths: [],
      flashes: [],
      utility: [],
      wasted: [],
      utility_throws: [],
      utility_damage_hits: []
    },
    error,
    isLoading
  };
}

export interface PlayerGameUtilityStats {
  flashes_thrown: number;
  enemies_flashed: number;
  teammates_flashed: number;
  smokes_thrown: number;
  utility_damage: number;
  wasted_utility: number;
}

export function useMatchGameUtilityStats(matchGameId: number, steamId: string) {
  const { data, error, isLoading } = useSWR<PlayerGameUtilityStats>(
    `/api/v1/match-games/${matchGameId}/utility-stats?steam_id=${steamId}`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data ?? null, error, isLoading };
}
