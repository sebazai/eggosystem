"use client";

import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import type { Team } from "@eggosystem/types";

export const useTeams = () => {
  const { data, error, isValidating } = useSWR<Team[], Error>(
    "/api/teams",
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    teams: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
