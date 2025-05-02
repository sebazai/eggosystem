"use client";

import { expressFetcher } from "@/lib/utils";
import type { SteamPlayer } from "@eggosystem/types";
import useSWR from "swr";

export const useSteamPlayer = (steamId: string) => {
  const apiUrl = `/api/v1/players/${steamId}`;

  const { data, error, isValidating, isLoading } = useSWR<SteamPlayer>(
    apiUrl,
    expressFetcher,
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
