"use client";

import {
  expressFetcher,
  getParamArray,
  type FilterParamsQuery
} from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";

export const useActiveSeason = (appId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<
    { season_id: number },
    Error
  >(`/api/v1/seasons/app/${appId}/active`, expressFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 24 * 60 * 60 * 1000
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (searchParams.size === 0 && data?.season_id) {
      const params = new URLSearchParams();
      params.append("seasons", data.season_id.toString());
      router.replace(`?${params.toString()}`, { scroll: false });
    } else {
      setReady(true);
    }
    // Only want to run this if active season changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.season_id]);

  const params = useMemo(() => {
    if (!ready) return null;
    return {
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
    } satisfies FilterParamsQuery;
  }, [ready, searchParams]);

  if (!ready || !params) {
    return {
      filterParams: null,
      activeSeason: null,
      isLoading: true,
      isValidating,
      isError: error
    };
  }

  return {
    filterParams: params,
    activeSeason: data,
    isLoading,
    isError: error,
    isValidating
  };
};
