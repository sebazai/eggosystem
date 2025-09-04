"use client";

import { useState } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import type { RoleActionResponse } from "@eggosystem/types";

export function useRoleActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRole = async (
    steamId: string,
    role: string
  ): Promise<RoleActionResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await clientApiFetch<RoleActionResponse>(
        "/api/v1/dashboard/role-management",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ steam_id: steamId, role })
        }
      );

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `Failed to add ${role} role`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeRole = async (
    steamId: string,
    role: string
  ): Promise<RoleActionResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await clientApiFetch<RoleActionResponse>(
        "/api/v1/dashboard/role-management",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ steam_id: steamId, role })
        }
      );

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `Failed to remove ${role} role`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addRole,
    removeRole,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}
