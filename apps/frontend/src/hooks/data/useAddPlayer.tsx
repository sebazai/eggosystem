"use client";

import { clientApiFetch } from "@/lib/apiClient";
import { mutate } from "swr";

interface AddPlayerPayload {
  kana_elo: number;
  calculus: Record<string, unknown>;
}

export const useAddPlayer = () => {
  const addPlayer = async (
    seasonId: string,
    teamId: string,
    steamId: string,
    payload: AddPlayerPayload
  ) => {
    const url = `/api/v1/dashboard/players/${steamId}/seasons/${seasonId}/team/${teamId}/add`;

    // Make the POST request
    const result = await clientApiFetch(url, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // Optionally invalidate related cache keys after successful addition
    // You can add specific keys here that should be revalidated
    await mutate(
      (key) =>
        typeof key === "string" &&
        (key.includes("/dashboard/sortter/") || key.includes("/teams/"))
    );

    return result;
  };

  return {
    addPlayer
  };
};
