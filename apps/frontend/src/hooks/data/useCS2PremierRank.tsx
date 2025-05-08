"use client";

import { expressFetcher } from "@/lib/utils";
import type { CS2LeetifyAvgRank } from "@eggosystem/types";
import useSWR from "swr";

export const useCS2PremierRank = (steamId?: string) => {
  const { data, error, isValidating, isLoading } = useSWR<
    CS2LeetifyAvgRank,
    Error
  >(`/api/v1/players/${steamId}/app/730/rank`, expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    cs2Rank: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
