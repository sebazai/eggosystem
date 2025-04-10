import type { Player } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import _ from "lodash";

/**
 * Should never be used for frontend.
 * @param steam_id
 * @returns Player
 */
export const getFullPlayerDetails = async (steam_id: string) => {
  const results = await runQuery<Player[]>(
    `SELECT * FROM Players WHERE steam_id = ?`,
    [steam_id]
  );
  return results.length > 0 ? results[0] : undefined;
};
