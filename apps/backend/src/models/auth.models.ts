import type { Player } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

/**
 * Use only in auth
 * @param steamId
 * @returns
 */
export const getAuthUserBySteamId = async (steamId: string) => {
  const [user] = await runQuery<Player[]>(
    "SELECT * FROM SteamPlayers WHERE steam_id = ?",
    [steamId]
  );

  if (!user) {
    return null;
  }
  return user;
};

interface CreateUserParams {
  steamId: string;
  steamDisplayName: string;
  steamRealname: string;
}

export const createSteamPlayer = async ({
  steamId,
  steamDisplayName,
  steamRealname
}: CreateUserParams) => {
  const results = await runQuery<{ insertId: number }>(
    "INSERT INTO SteamPlayers (steam_id, nickname, full_name) VALUES (?, ?, ?)",
    [steamId, steamDisplayName, steamRealname]
  );
  return String(results.insertId);
};
