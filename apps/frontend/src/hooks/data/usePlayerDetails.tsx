"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { PlayerDetails } from "@eggosystem/types";
import useSWR from "swr";

interface UsePlayerDetailsProps extends FilterParamsQuery {
  steamId: string;
}

export const usePlayerDetails = ({
  steamId,
  ...params
}: UsePlayerDetailsProps) => {
  const sortedQuery = generateFiltersParamQuery(params);
  const apiUrl = `/api/v1/players/${steamId}/statistics?${sortedQuery}`;

  const { data, error, isValidating, isLoading } = useSWR<PlayerDetails>(
    apiUrl,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    playerDetails: data,
    isLoading,
    isError: error,
    isValidating
  };
};
