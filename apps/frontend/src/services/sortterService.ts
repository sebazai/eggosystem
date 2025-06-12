import { nextFetcher } from "@/lib/fetcher";

export interface TeamSortterValues {
  team_id: number;
  team_name: string;
  top5_values: number[];
  comments?: string;
}

/**
 * Fetches team values for a specific season
 * @param seasonId The season ID to fetch team values for
 * @returns Promise containing array of team values
 */
export async function fetchTeamValues(
  seasonId: number
): Promise<TeamSortterValues[]> {
  return nextFetcher<TeamSortterValues[]>(`/api/v1/sortter/season/${seasonId}`);
}

/**
 * Fetches team value for a specific team in a specific season
 * @param seasonId The season ID
 * @param teamId The team ID
 * @returns Promise containing team values
 */
export async function fetchTeamValue(
  seasonId: number,
  teamId: number
): Promise<TeamSortterValues> {
  return nextFetcher<TeamSortterValues>(
    `/api/v1/sortter/season/${seasonId}/team/${teamId}`
  );
}
