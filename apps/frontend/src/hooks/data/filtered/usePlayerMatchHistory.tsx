"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { MatchHistoryResult } from "@eggosystem/types";
import useSWR from "swr";

interface UsePlayerMatchHistoryProps extends FilterParamsQuery {
  steamId: string;
}

export const usePlayerMatchHistory = ({
  steamId,
  ...params
}: UsePlayerMatchHistoryProps) => {
  const sortedQuery = generateFiltersParamQuery(params);
  const apiUrl = `/api/v1/filters/players/${steamId}/match-history?${sortedQuery}`;

  const { data, error, isValidating, isLoading } = useSWR<
    Array<MatchHistoryResult>
  >(apiUrl, expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    matchHistory: data,
    isLoading,
    isError: error,
    isValidating
  };
};
