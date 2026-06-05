import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";

const DEFAULT_TEST_SIGNUP_PLAYER_LIMITS = {
  min_players: 5,
  max_players: 9
} as const;

export async function insertTestSeasonSignupSettings(
  seasonId: number,
  limits: {
    min_players: number;
    max_players: number;
  } = DEFAULT_TEST_SIGNUP_PLAYER_LIMITS,
  connection?: PoolConnection
): Promise<void> {
  await runQuery(
    `INSERT IGNORE INTO SeasonSignupSettings (season_id, min_players, max_players)
     VALUES (?, ?, ?)`,
    [seasonId, limits.min_players, limits.max_players],
    connection
  );
}

export async function deleteTestSeasonSignupSettings(
  seasonId: number,
  connection?: PoolConnection
): Promise<void> {
  await runQuery(
    "DELETE FROM SeasonSignupSettings WHERE season_id = ?",
    [seasonId],
    connection
  );
}
