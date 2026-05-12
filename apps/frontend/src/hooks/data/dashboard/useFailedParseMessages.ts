"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import type {
  FailedParseMessagesResponse,
  ReparseRequest,
  ReparseResponse,
  Requeue2ddataRequest,
  Requeue2ddataResponse
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
  mutate: () => Promise<FailedParseMessagesResponse | undefined>;
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
    mutate: async () =>
      (await mutate()) as FailedParseMessagesResponse | undefined
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

export const useRequeue2ddataMessages = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<Requeue2ddataResponse | null>(
    null
  );

  const submitRequeue2ddata = useCallback(
    async (request: Requeue2ddataRequest): Promise<Requeue2ddataResponse> => {
      setIsSubmitting(true);
      try {
        const result = await clientApiFetch<Requeue2ddataResponse>(
          "/api/v1/dashboard/demos/failed/parse/requeue-2ddata",
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
    submitRequeue2ddata,
    isSubmitting,
    lastResult
  };
};

export const useRequeueAllFailedMessages = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ReparseResponse | null>(null);

  const submitRequeueAll = useCallback(
    async (request: {
      queue_name: string;
      priority?: number;
    }): Promise<ReparseResponse> => {
      setIsSubmitting(true);
      try {
        const result = await clientApiFetch<ReparseResponse>(
          "/api/v1/dashboard/demos/failed/parse/requeue-all",
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
    submitRequeueAll,
    isSubmitting,
    lastResult
  };
};
