"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";

export interface ManageableRolesResponse {
  success: boolean;
  data: string[];
}

export function useManageableRoles() {
  const { data, error, isValidating } = useSWR<ManageableRolesResponse>(
    "/api/v1/dashboard/role-management/manageable-roles",
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    roles: data?.data || [],
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
}
