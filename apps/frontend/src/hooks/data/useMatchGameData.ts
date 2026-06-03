"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  GamePlayerStats,
  MapRoundInfo,
  MatchGameOpeningDuel,
  MatchGameTradeStats,
  WeaponStat,
  HitGroupCount,
  HitStats,
  RoundKillEvent,
  RoundDeathEvent,
  RoundFlashEvent,
  RoundUtilityEvent,
  RoundWastedUtilityEvent,
  RoundUtilityThrowEvent,
  RoundUtilityDamageEvent,
  PlayerRoundEvents,
  PlayerGameUtilityStats
} from "@eggosystem/types";

export type {
  WeaponStat,
  HitGroupCount,
  HitStats,
  RoundKillEvent,
  RoundDeathEvent,
  RoundFlashEvent,
  RoundUtilityEvent,
  RoundWastedUtilityEvent,
  RoundUtilityThrowEvent,
  RoundUtilityDamageEvent,
  PlayerRoundEvents,
  PlayerGameUtilityStats
};

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

export function useMatchGameHitStats(matchGameId: number, steamId: string) {
  const { data, error, isLoading } = useSWR<HitStats>(
    `/api/v1/match-games/${matchGameId}/hit-stats?steam_id=${steamId}`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data ?? null, error, isLoading };
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

export function useMatchGameUtilityStats(matchGameId: number, steamId: string) {
  const { data, error, isLoading } = useSWR<PlayerGameUtilityStats>(
    `/api/v1/match-games/${matchGameId}/utility-stats?steam_id=${steamId}`,
    clientApiFetch,
    SWR_OPTIONS
  );
  return { data: data ?? null, error, isLoading };
}
