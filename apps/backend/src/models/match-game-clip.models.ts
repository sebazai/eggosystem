import { type MatchGameClip } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const hasDemoProcessingRequest = async (
  gameId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT * FROM MatchGameClips WHERE game_id = ?`;
  const rows = await runQuery<MatchGameClip[]>(query, [gameId], connection);
  return rows.length > 0;
};
