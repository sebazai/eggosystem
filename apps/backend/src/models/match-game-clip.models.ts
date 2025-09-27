import { type MatchGameClip } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getMatchGameClipForGameId = async (matchGameId: number) => {
  const query = `SELECT * FROM MatchGameClips WHERE match_game_id = ?`;
  const rows = await runQuery<MatchGameClip[]>(query, [matchGameId]);
  return rows;
};
