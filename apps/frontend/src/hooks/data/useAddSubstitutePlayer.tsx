"use client";

import { clientApiFetch } from "@/lib/apiClient";

interface AddSubstitutePlayerParams {
  seasonId: string;
  teamId: string;
  steamId: string;
  matchId: string;
  replacesSteamId?: string;
  ticketNumber: string;
}

interface AddSubstitutePlayerResponse {
  message: string;
  steam_id: string;
  team_id: number;
  season_id: number;
  role: "substitute";
  match_id: number;
  replaces_steam_id: string | null;
  ticket_number: string;
}

export const useAddSubstitutePlayer = () => {
  const addSubstitutePlayer = async ({
    seasonId,
    teamId,
    steamId,
    matchId,
    replacesSteamId,
    ticketNumber
  }: AddSubstitutePlayerParams): Promise<AddSubstitutePlayerResponse> => {
    const body: {
      match_id: string;
      replaces_steam_id?: string;
      ticket_number: string;
    } = {
      match_id: matchId,
      ticket_number: ticketNumber
    };

    if (replacesSteamId) {
      body.replaces_steam_id = replacesSteamId;
    }

    const response = await clientApiFetch<AddSubstitutePlayerResponse>(
      `/api/v1/dashboard/players/${steamId}/team/${teamId}/season/${seasonId}/substitute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    return response;
  };

  return { addSubstitutePlayer };
};
