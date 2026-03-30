"use client";

import { clientApiFetch } from "@/lib/apiClient";
import { mutate } from "swr";

export const useDiscardPlayer = () => {
  const discardPlayer = async (
    seasonId: string,
    teamId: string,
    steamId: string,
    ticketNumber?: string
  ) => {
    const url = `/api/v1/dashboard/players/${steamId}/team/${teamId}/season/${seasonId}/discard`;

    const body: { ticket_number?: string } = {};
    if (ticketNumber !== undefined && ticketNumber.trim() !== "") {
      body.ticket_number = ticketNumber.trim();
    }

    const result = await clientApiFetch(url, {
      method: "POST",
      body: JSON.stringify(body)
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
