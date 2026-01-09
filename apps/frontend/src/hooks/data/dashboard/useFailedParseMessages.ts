"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import type {
  FailedParseMessagesResponse,
  FailedParseStatsResponse,
  ReparseRequest,
  ReparseResponse
} from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

interface UseFailedParseMessagesParams {
  limit?: number;
  offset?: number;
  queue_name?: string;
  status?: string;
}

export const useFailedParseMessages = (
  params: UseFailedParseMessagesParams = {}
): {
  failedMessages: FailedParseMessagesResponse["messages"];
  pagination: FailedParseMessagesResponse["pagination"] | undefined;
  filters: FailedParseMessagesResponse["filters"] | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: () => void;
} => {
  // Memoize the endpoint to prevent unnecessary re-renders
  const endpoint = useMemo(() => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.offset) queryParams.set("offset", params.offset.toString());
    if (params.queue_name) queryParams.set("queue_name", params.queue_name);
    if (params.status) queryParams.set("status", params.status);

    const queryString = queryParams.toString();
    return `/api/v1/dashboard/demos/failed/parse${queryString ? "?" + queryString : ""}`;
  }, [params.limit, params.offset, params.queue_name, params.status]);

  const { data, error, isLoading, mutate } =
    useSWR<FailedParseMessagesResponse>(endpoint, clientApiFetch, {
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    });

  return {
    failedMessages: data?.messages || [],
    pagination: data?.pagination,
    filters: data?.filters,
    isLoading,
    error,
    mutate
  };
};

const useFailedParseStats = (): {
  stats: FailedParseStatsResponse["stats"];
  isLoading: boolean;
  error: unknown;
  mutate: () => void;
} => {
  const { data, error, isLoading, mutate } = useSWR<FailedParseStatsResponse>(
    "/api/v1/dashboard/demos/failed/parse/stats",
    clientApiFetch,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  return {
    stats: data?.stats || [],
    isLoading,
    error,
    mutate
  };
};

export const useReparseMessages = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ReparseResponse | null>(null);

  const submitReparse = useCallback(
    async (request: ReparseRequest): Promise<ReparseResponse> => {
      setIsSubmitting(true);
      try {
        const result = await clientApiFetch<ReparseResponse>(
          "/api/v1/dashboard/demos/failed/parse/reparse",
          {
            method: "POST",
            body: JSON.stringify(request)
          }
        );

        setLastResult(result);
        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    submitReparse,
    isSubmitting,
    lastResult
  };
};
