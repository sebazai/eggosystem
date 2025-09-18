"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { RedisKeyDataResponse } from "@eggosystem/types";

export function useRedisKeyData(key: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<RedisKeyDataResponse>(
    key ? `/api/v1/dashboard/redis/keys/${encodeURIComponent(key)}` : null,
    clientApiFetch,
    {
      revalidateOnFocus: false,
      // Only fetch if key is provided
      isPaused: () => !key
    }
  );

  return {
    keyData: data?.data || null,
    isLoading,
    isError: error,
    isValidating
  };
}
