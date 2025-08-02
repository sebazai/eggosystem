import { type MatchGameClip } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getMatchGameClipForGameId = async (gameId: number) => {
  const query = `SELECT * FROM MatchGameClips WHERE game_id = ?`;
  const rows = await runQuery<MatchGameClip[]>(query, [gameId]);
  return rows;
};
