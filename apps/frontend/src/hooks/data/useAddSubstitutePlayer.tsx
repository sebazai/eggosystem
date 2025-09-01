"use client";

import { clientApiFetch } from "@/lib/apiClient";

interface AddSubstitutePlayerParams {
  seasonId: string;
  teamId: string;
  steamId: string;
  matchId?: string;
}

interface AddSubstitutePlayerResponse {
  message: string;
  steam_id: string;
  team_id: number;
  season_id: number;
  role: "substitute";
  match_id: string | null;
}

export const useAddSubstitutePlayer = () => {
  const addSubstitutePlayer = async ({
    seasonId,
    teamId,
    steamId,
    matchId
  }: AddSubstitutePlayerParams): Promise<AddSubstitutePlayerResponse> => {
    const body: { match_id?: string } = {};
    if (matchId !== undefined && matchId !== null) {
      body.match_id = matchId;
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
