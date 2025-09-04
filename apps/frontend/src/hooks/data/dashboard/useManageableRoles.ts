"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { ManageableRolesResponse } from "@eggosystem/types";

export function useManageableRoles() {
  const { data, error, isLoading, isValidating } =
    useSWR<ManageableRolesResponse>(
      "/api/v1/dashboard/role-management/manageable-roles",
      clientApiFetch,
      { revalidateOnFocus: false }
    );

  return {
    roles: data?.data || [],
    isLoading,
    isError: error,
    isValidating
  };
}
