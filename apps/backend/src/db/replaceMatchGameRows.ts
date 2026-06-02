import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "./mysqlRunQuery";

const _MATCH_GAME_TABLES = [
  "FlashEvents",
  "MapRoundStats",
  "PlayerClutches",
  "PlayerHitLogs",
  "PlayerKillLogs",
  "PlayerRoundImpacts",
  "PlayerStats",
  "PlayerTrades",
  "RoundSwingEvents",
  "RoundUtilitySummary",
  "SetupEvents",
  "WastedUtilityEvents"
] as const;

export type MatchGameTable = (typeof _MATCH_GAME_TABLES)[number];

/**
 * Deletes all rows for a match game, then runs insert.
 *
 * Must be called with a `PoolConnection` that already has an open transaction
 * (`beginTransaction` on the caller). If `insert` throws, the caller's
 * `rollback()` restores the deleted rows — a failed insert never commits an
 * empty table.
 */
export async function replaceMatchGameRows(
  connection: PoolConnection,
  matchGameId: number,
  tableName: MatchGameTable,
  insert: () => Promise<void>
): Promise<void> {
  await runQuery(
    `DELETE FROM ${tableName} WHERE match_game_id = ?`,
    [matchGameId],
    connection
  );
  await insert();
}
