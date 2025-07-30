import { type TeamGameScore } from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";

export const insertTeamGameScore = async ({
  match_id,
  team_id,
  game_id,
  starting_side,
  score,
  halftime_score,
  overtime_score,
  connection
}: Omit<TeamGameScore, "id"> & { connection?: PoolConnection }) => {
  const query = `INSERT INTO TeamGameScore (match_id, team_id, game_id, starting_side, score, halftime_score, overtime_score) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  return runQuery(
    query,
    [
      match_id,
      team_id,
      game_id,
      starting_side,
      score,
      halftime_score,
      overtime_score
    ],
    connection
  );
};
