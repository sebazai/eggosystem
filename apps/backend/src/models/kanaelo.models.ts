import { runQuery } from "../db/mysqlRunQuery";

/**
 * Gets all unique players for a specific season
 * Returns their steam IDs to be used for kanaelo calculation
 *
 * @param seasonId The season ID to filter players by
 * @returns Array of steam IDs
 */
export const getAllRegisteredPlayersForSeason = async (
  seasonId: number
): Promise<string[]> => {
  const query = `
    SELECT DISTINCT
      stp.steam_id
    FROM SeasonTeamRegistrationPlayers stp
    JOIN SteamPlayers sp ON sp.steam_id = stp.steam_id
    WHERE stp.season_id = ?
  `;

  const results = await runQuery<{ steam_id: string }[]>(query, [seasonId]);

  // Extract just the steam IDs from the results
  return results.map((player) => player.steam_id);
};

/**
 * Gets all players from SteamPlayers table
 * Returns their steam IDs to be used for kanaelo calculation
 *
 * @returns Array of steam IDs
 */
export const getAllPlayersFromSteamPlayers = async (): Promise<string[]> => {
  const query = `SELECT steam_id FROM SteamPlayers`;

  const results = await runQuery<{ steam_id: string }[]>(query);

  // Extract just the steam IDs from the results
  return results.map((player) => player.steam_id);
};
