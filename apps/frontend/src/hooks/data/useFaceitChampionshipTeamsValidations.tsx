"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { TeamWithExternalDataValidated } from "@eggosystem/types";

export const useFaceitChampionshipTeamsValidations = (
  championshipId: string
) => {
  const { data, error, isLoading, isValidating } = useSWR<
    {
      teams: Record<string, TeamWithExternalDataValidated>;
      maximumSlots: number;
    },
    Error
  >(`/api/v1/faceit/championship/${championshipId}/validate`, expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    championshipTeams: data,
    isLoading,
    isError: error,
    isValidating
  };
};
