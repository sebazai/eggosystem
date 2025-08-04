import { type TeamGameScore } from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";

export const upsertTeamGameScore = async ({
  match_id,
  team_id,
  game_id,
  starting_side,
  score,
  halftime_score,
  overtime_score,
  connection
}: Omit<TeamGameScore, "id"> & { connection?: PoolConnection }) => {
  const query = `INSERT INTO TeamGameScores (
    match_id,
    team_id,
    game_id,
    starting_side,
    score,
    halftime_score,
    overtime_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      game_id = VALUES(game_id),
      starting_side = VALUES(starting_side),
      score = VALUES(score),
      halftime_score = VALUES(halftime_score),
      overtime_score = VALUES(overtime_score)`;

  const queryParams = [
    match_id,
    team_id,
    game_id,
    starting_side,
    score,
    halftime_score,
    overtime_score
  ];

  return runQuery<{
    insertId: number;
    affectedRows?: number;
  }>(query, queryParams, connection);
};
