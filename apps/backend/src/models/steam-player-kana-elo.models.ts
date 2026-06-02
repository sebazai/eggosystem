import { type SteamPlayer, type SteamPlayerKanaElo } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export interface LiveKanaEloPlayer {
  steam_id: SteamPlayer["steam_id"];
  kana_elo: SteamPlayerKanaElo["kana_elo"];
  nickname: SteamPlayer["nickname"];
}

/**
 * Read the live top-X players by kana elo straight from SteamPlayerKanaElo
 * (the source of truth for current ratings), joined to SteamPlayers for the
 * nickname. Ordered highest kana elo first.
 *
 * NOTE: This intentionally does NOT use getTopXPlayersKanaElo, which reads
 * per-season snapshots from SeasonPlayerRanks. Live ratings live here.
 *
 * @param limit Maximum number of players to return.
 * @returns Players ordered by kana_elo descending.
 */
export const getTopLiveKanaEloPlayers = async (
  limit: number
): Promise<LiveKanaEloPlayer[]> => {
  return runQuery<LiveKanaEloPlayer[]>(
    `SELECT spke.steam_id, spke.kana_elo, sp.nickname
       FROM SteamPlayerKanaElo spke
       JOIN SteamPlayers sp ON sp.steam_id = spke.steam_id
      WHERE spke.kana_elo IS NOT NULL
        AND spke.kana_elo >= 0
      ORDER BY spke.kana_elo DESC
      LIMIT ?`,
    [limit]
  );
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
