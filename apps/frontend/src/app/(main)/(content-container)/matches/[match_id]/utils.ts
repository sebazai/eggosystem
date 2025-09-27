import { envConfig } from "@/configs/env";

export async function getMatchInfo<T>(matchId: number): Promise<T> {
  const res = await fetch(
    `${envConfig.API_URL}/api/v1/matches/${matchId}/info`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch match info");
  }

  const result = await res.json();
  if (typeof result.teams === "string") {
    result.teams = JSON.parse(result.teams);
  }
  return result;
}

export async function getMatchGame<T>(
  matchId: number,
  matchGameId: number
): Promise<T> {
  const res = await fetch(
    `${envConfig.API_URL}/api/v1/matches/${matchId}/games/${matchGameId}`
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message ?? "Could not fetch match game");
  }

  const result = await res.json();
  return result;
}
