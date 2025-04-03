import { envConfig } from "@/configs/env";

export async function getMatchInfo<T>(matchId: string): Promise<T> {
  const res = await fetch(
    `${envConfig.API_URL}/api/v1/matches/${matchId}/info`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch match info");
  }

  const result = await res.json();
  if (typeof result.teams === "string") {
    try {
      result.teams = JSON.parse(result.teams);
    } catch (error) {
      console.error("Failed to parse teams JSON:", error);
    }
  }
  return result;
}
