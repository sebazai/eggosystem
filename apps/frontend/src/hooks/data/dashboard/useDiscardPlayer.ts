"use client";

import { clientApiFetch } from "@/lib/apiClient";
import { mutate } from "swr";

export const useDiscardPlayer = () => {
  const discardPlayer = async (
    seasonId: string,
    teamId: string,
    steamId: string
  ) => {
    const url = `/api/v1/dashboard/players/${steamId}/team/${teamId}/season/${seasonId}/discard`;

    // Make the POST request
    const result = await clientApiFetch(url, {
      method: "POST"
    });

    // Invalidate related cache keys after successful discard
    await mutate(
      (key) =>
        typeof key === "string" &&
        (key.includes("/dashboard/sortter/") ||
          key.includes("/teams/") ||
          key.includes("/players"))
    );

    return result;
  };

  return {
    discardPlayer
  };
};
