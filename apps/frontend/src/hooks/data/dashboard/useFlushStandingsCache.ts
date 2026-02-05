"use client";

import { useState } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import type { RedisFlushStandingsCacheResponse } from "@eggosystem/types";

export function useFlushStandingsCache() {
  const [isFlushing, setIsFlushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flushStandingsCache = async (): Promise<
    { success: true; deletedCount: number } | { success: false }
  > => {
    setIsFlushing(true);
    setError(null);

    try {
      const response = await clientApiFetch<RedisFlushStandingsCacheResponse>(
        "/api/v1/dashboard/redis/flush-standings-caches",
        { method: "POST" }
      );

      if (response.success) {
        return { success: true, deletedCount: response.deletedCount };
      }
      setError(response.message ?? "Failed to flush standings caches");
      return { success: false };
    } catch (_err) {
      setError("Failed to flush standings caches");
      return { success: false };
    } finally {
      setIsFlushing(false);
    }
  };

  return {
    flushStandingsCache,
    isFlushing,
    error
  };
}
