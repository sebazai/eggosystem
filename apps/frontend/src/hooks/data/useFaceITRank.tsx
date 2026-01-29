"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import { SeasonPlatform } from "@eggosystem/types";

interface UseFaceITRankOptions {
  skipExternalCheck?: boolean;
}

export const useFaceITRank = (
  steamId?: string,
  options?: UseFaceITRankOptions
) => {
  const skipExternalCheck = options?.skipExternalCheck === true;
  const query = skipExternalCheck ? "?skipExternalCheck" : "";
  const key =
    steamId &&
    `/api/v1/players/${steamId}/platform/${SeasonPlatform.FACEIT}/rank${query}`;

  const { data, error, isValidating, isLoading } = useSWR<
    { faceit_level: number },
    Error
  >(key || null, expressFetcher, { revalidateOnFocus: false });

  return {
    faceItRank: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
