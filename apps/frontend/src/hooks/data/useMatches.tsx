"use client";

import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import type { MatchesByFilters } from "@eggosystem/types";

interface UseRecentMatchesProps {
  seasons: number[];
  leagues: number[];
  stages: number[];
  teams: number[];
  maps: number[];
}

export const useRecentMatches = ({
  seasons,
  stages,
  maps
}: UseRecentMatchesProps) => {
  const { data, error, isValidating } = useSWR<MatchesByFilters[]>(
    `/api/matches?season=${seasons}&stage=${stages}&map=${maps}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    matches: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
