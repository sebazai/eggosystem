"use client";

import { expressFetcher } from "@/lib/utils";
import type { SteamPlayer } from "@eggosystem/types";
import useSWR from "swr";

export const useSteamPlayer = (steamId: string | undefined) => {
  const apiUrl = steamId ? `/api/v1/players/${steamId}` : null;

  const { data, error, isValidating, isLoading } = useSWR<SteamPlayer>(
    apiUrl,
    apiUrl ? expressFetcher : null,
    {
      revalidateOnFocus: false
    }
  );

  return {
    steamPlayer: data,
    isLoading,
    isError: error,
    isValidating
  };
};
