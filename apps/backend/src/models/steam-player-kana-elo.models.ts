import { type SteamPlayerKanaElo } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

const getPlayerKanaElo = async (steam_id: string) => {
  const [result] = await runQuery<
    Array<{ kana_elo: SteamPlayerKanaElo["kana_elo"] } | undefined>
  >(`SELECT kana_elo FROM SteamPlayerKanaElo WHERE steam_id = ?`, [steam_id]);
  return result;
};

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
