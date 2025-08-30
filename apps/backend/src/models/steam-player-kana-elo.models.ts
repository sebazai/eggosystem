import { type SteamPlayerKanaElo } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getPlayerKanaElo = async (steam_id: string) => {
  const [result] = await runQuery<
    Array<{ kana_elo: SteamPlayerKanaElo["kana_elo"] } | undefined>
  >(`SELECT kana_elo FROM SteamPlayerKanaElo WHERE steam_id = ?`, [steam_id]);
  return result;
};
