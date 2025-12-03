"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { SeasonFaceitRosterValidation } from "@eggosystem/types";

export const useFaceitRosterValidation = (seasonId?: number) => {
  const { data, error, isLoading, mutate } =
    useSWR<SeasonFaceitRosterValidation>(
      seasonId
        ? `/api/v1/dashboard/faceit-validation/seasons/${seasonId}/roster-comparison`
        : null,
      clientApiFetch,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false
      }
    );

  const forceRefresh = async () => {
    if (!seasonId) return;
    // Call API with refresh=true query parameter to clear cache
    await clientApiFetch(
      `/api/v1/dashboard/faceit-validation/seasons/${seasonId}/roster-comparison?refresh=true`
    );
    // Revalidate the SWR cache
    await mutate();
  };

  return {
    validation: data,
    isLoading,
    error,
    refresh: forceRefresh
  };
};
