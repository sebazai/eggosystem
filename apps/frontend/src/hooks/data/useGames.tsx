"use client";

import { expressFetcher } from "@/lib/utils";
import type { Game } from "@eggosystem/types";
import useSWR from "swr";

export const useGames = () => {
  const { data, error, isValidating } = useSWR<Game[]>(
    "/api/v1/games",
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    games: data || [],
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
