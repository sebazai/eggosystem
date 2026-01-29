"use client";

import { expressFetcher } from "@/lib/utils";
import type { CS2LeetifyAvgRank } from "@eggosystem/types";
import useSWR from "swr";

interface UseCS2PremierRankOptions {
  skipExternalCheck?: boolean;
}

export const useCS2PremierRank = (
  steamId?: string,
  options?: UseCS2PremierRankOptions
) => {
  const skipExternalCheck = options?.skipExternalCheck === true;
  const query = skipExternalCheck ? "?skipExternalCheck" : "";
  const key = steamId
    ? `/api/v1/players/${steamId}/app/730/rank${query}`
    : null;

  const { data, error, isValidating, isLoading } = useSWR<
    CS2LeetifyAvgRank,
    Error
  >(key, expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    cs2Rank: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
