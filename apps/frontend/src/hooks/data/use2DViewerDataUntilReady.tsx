"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import { envConfig } from "@/configs/env";
import { useMemo } from "react";

interface TwoDViewerReturnData {
  gameId: number;
  map: string;
  status:
    | "processing"
    | "pending"
    | "parsing"
    | "error"
    | "retry"
    | "failed"
    | "ready";
  progress: number;
  createdAt: string;
  filePath: string;
  data: null;
}

export function use2DViewerDataUntilReady(gameId: string) {
  const { data, error, isValidating, isLoading } = useSWR<
    TwoDViewerReturnData[] | undefined
  >(`${envConfig.VIEWER_API_URL}/api/v1/demos`, expressFetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
    refreshInterval: (data) => {
      if (data) {
        const gameData = data.find((item) => item.gameId.toString() === gameId);
        if (gameData && gameData.status === "ready") {
          return 0;
        }
        return 30000;
      }
      return 0;
    }
  });

  const hasViewerData = useMemo(() => {
    if (!data) return undefined;
    return data.find((item) => item.gameId.toString() === gameId);
  }, [data, gameId]);

  const isReady = hasViewerData?.status === "ready";
  const isProcessing = hasViewerData && hasViewerData.status !== "ready";

  return {
    hasViewerData,
    isLoading,
    isError: error,
    isValidating,
    isReady,
    isProcessing
  };
}
