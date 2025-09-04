"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { RoleResponse } from "@eggosystem/types";

export function useUsersWithRole(role: string) {
  const { data, error, isValidating, mutate } = useSWR<RoleResponse>(
    role ? `/api/v1/dashboard/role-management/${role}` : null,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    users: data?.data || [],
    isLoading: !data && !error,
    isError: error,
    isValidating,
    mutate
  };
}
