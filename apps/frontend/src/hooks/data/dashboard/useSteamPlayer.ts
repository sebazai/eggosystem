"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { SteamPlayer } from "@eggosystem/types";

export function useSteamPlayer(steamId: string) {
  const { data, error, isLoading, isValidating } = useSWR<{
    steam_id: SteamPlayer["steam_id"];
    nickname: SteamPlayer["nickname"];
  }>(`/api/v1/dashboard/players/${steamId}`, clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    player: data || null,
    isLoading,
    isError: error,
    isValidating
  };
}
