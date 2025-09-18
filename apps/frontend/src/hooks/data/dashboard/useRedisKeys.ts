"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { RedisKeysResponse } from "@eggosystem/types";

export function useRedisKeys(pattern: string = "*") {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<RedisKeysResponse>(
      `/api/v1/dashboard/redis/keys?pattern=${encodeURIComponent(pattern)}`,
      clientApiFetch,
      {
        revalidateOnFocus: false,
        // Only fetch if pattern is provided
        isPaused: () => !pattern
      }
    );

  return {
    keys: data?.data || [],
    isLoading,
    isError: error,
    isValidating,
    mutate
  };
}
