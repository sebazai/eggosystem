"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";

export interface RoleUser {
  account_id: number;
  nickname: string;
  steam_id: string;
}

export interface RoleResponse {
  success: boolean;
  data: RoleUser[];
}

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
