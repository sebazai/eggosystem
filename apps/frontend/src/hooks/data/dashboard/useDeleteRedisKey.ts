"use client";

import { useState } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import type { RedisDeleteResponse } from "@eggosystem/types";

export function useDeleteRedisKey() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteKey = async (key: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await clientApiFetch<RedisDeleteResponse>(
        `/api/v1/dashboard/redis/keys/${encodeURIComponent(key)}`,
        {
          method: "DELETE"
        }
      );

      if (response.success) {
        return true;
      } else {
        setError("Failed to delete key");
        return false;
      }
    } catch (err) {
      setError("Failed to delete key");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteKey,
    isDeleting,
    error
  };
}
