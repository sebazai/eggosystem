"use client";

import { expressFetcher } from "@/lib/utils";
import type { DemoData } from "@eggosystem/viewer";
import useSWR from "swr";
import { envConfig } from "@/configs/env";

type TwoDViewerProcessingStatus = {
  matchGameId: number;
  map: string;
  status: "processing" | "pending" | "parsing" | "error" | "retry" | "failed";
  progress: number;
  createdAt: string;
  filePath: string;
  data: null;
};

type TwoDViewerReadyStatus = {
  matchGameId: number;
  map: string;
  status: "ready";
  progress: 100;
  createdAt: string;
  parsedAt: string;
  tickCount: number;
  filePath: string;
  data: DemoData;
};

type TwoDViewerReturnData = TwoDViewerProcessingStatus | TwoDViewerReadyStatus;

export function use2DViewerData(matchGameId: number) {
  const { data, error, isValidating, isLoading } = useSWR<
    TwoDViewerReturnData | undefined
  >(
    `${envConfig.VIEWER_API_URL}/api/v1/demos/game/${matchGameId}`,
    expressFetcher,
    {
      refreshInterval: (data) => {
        if (data?.status !== "ready") {
          return 30000;
        }
        return 0;
      },
      revalidateOnFocus: true,
      shouldRetryOnError: false
    }
  );

  return {
    twoDViewerData: data,
    isLoading,
    isError: error,
    isValidating
  };
}
