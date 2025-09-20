"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type {
  FailedParseMessagesResponse,
  FailedParseStatsResponse,
  ReparseRequest,
  ReparseResponse
} from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

interface UseFailedParseMessagesParams {
  limit?: number;
  offset?: number;
  queue_name?: string;
  status?: string;
}

export const useFailedParseMessages = (
  params: UseFailedParseMessagesParams = {}
) => {
  const { user } = useAuth();

  // Build query string
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.offset) queryParams.set("offset", params.offset.toString());
  if (params.queue_name) queryParams.set("queue_name", params.queue_name);
  if (params.status) queryParams.set("status", params.status);

  const queryString = queryParams.toString();
  const endpoint = `/api/v1/dashboard/demos/failed/parse${queryString ? "?" + queryString : ""}`;

  const { data, error, isLoading, mutate } =
    useSWR<FailedParseMessagesResponse>(
      user ? endpoint : null,
      clientApiFetch,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true
      }
    );

  return {
    failedMessages: data?.messages || [],
    pagination: data?.pagination,
    filters: data?.filters,
    isLoading,
    error,
    mutate
  };
};

export const useFailedParseStats = () => {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<FailedParseStatsResponse>(
    user ? "/api/v1/dashboard/demos/failed/parse/stats" : null,
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
