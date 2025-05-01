"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import { SeasonPlatform } from "@eggosystem/types";

export const useFaceITRank = (steamId?: string) => {
  const { data, error, isValidating, isLoading } = useSWR<
    { faceit_level: number },
    Error
  >(
    `/api/v1/players/${steamId}/platform/${SeasonPlatform.FACEIT}/rank`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    faceItRank: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
