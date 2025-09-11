"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { FaceitPlayerRankWithUrl } from "@eggosystem/types";

export const useFaceitPlayerData = (steamId?: string) => {
  const { data, error, isValidating, isLoading } = useSWR<
    FaceitPlayerRankWithUrl,
    Error
  >(
    steamId ? `/api/v1/faceit/players/${steamId}/faceit` : null,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    faceitPlayerData: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
