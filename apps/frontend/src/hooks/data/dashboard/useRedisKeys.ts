"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { RedisKeysResponse } from "@eggosystem/types";

interface UseRedisKeysOptions {
  pattern: string;
  page?: number;
  limit?: number;
}

export function useRedisKeys({
  pattern,
  page = 1,
  limit = 50
}: UseRedisKeysOptions) {
  // Only fetch if pattern is provided and not empty or "*"
  const shouldFetch =
    pattern && pattern.trim() !== "" && pattern.trim() !== "*";

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<RedisKeysResponse>(
      shouldFetch
        ? `/api/v1/dashboard/redis/keys?pattern=${encodeURIComponent(pattern)}&page=${page}&limit=${limit}`
        : null,
      clientApiFetch,
      {
        revalidateOnFocus: false,
        // Only fetch if pattern is valid
        isPaused: () => !shouldFetch
      }
    );

  return {
    keys: data?.data || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0
    },
    isLoading,
    isError: error,
    isValidating,
    mutate
  };
}
