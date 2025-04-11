"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

export const useActiveSeason = (appId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<
    { season_id: number },
    Error
  >(`/api/v1/seasons/app/${appId}/active`, expressFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 24 * 60 * 60 * 1000
  });

  return {
    activeSeason: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
