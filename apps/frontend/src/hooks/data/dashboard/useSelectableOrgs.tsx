"use client";

import type { Team } from "@eggosystem/types";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

export const useSelectableOrgs = () => {
  const { data, error, isLoading, isValidating } = useSWR<Team[]>(
    "/api/v1/dashboard/organizations",
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  if (!data) {
    return { organizations: data, isLoading, error, isValidating };
  }

  const selectableOrganizations = data
    .map((org) => ({
      id: org.id,
      name: org.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    organizations: selectableOrganizations,
    isLoading,
    error,
    isValidating
  };
};
