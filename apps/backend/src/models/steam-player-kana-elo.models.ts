import { runQuery } from "../db/mysqlRunQuery";

/**
 * Insert or update player kana_elo in SteamPlayerKanaElo table
 * @param steam_id The steam ID of the player
 * @param kana_elo The kana_elo value to insert/update
 * @returns Promise resolving to the result of the query
 */
export const upsertPlayerKanaElo = async (
  steam_id: string,
  kana_elo: number
): Promise<void> => {
  const query = `
    INSERT INTO SteamPlayerKanaElo (steam_id, kana_elo) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE kana_elo = VALUES(kana_elo)
  `;

  await runQuery(query, [steam_id, kana_elo]);
};
