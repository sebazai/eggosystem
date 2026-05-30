import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type RoundUtilitySummaryEntry } from "../types/parse-queue.types";

interface SaveRoundUtilitySummaryParams {
  matchGameId: number;
  entries: RoundUtilitySummaryEntry[];
  connection: PoolConnection;
}

/**
 * Replaces all round utility summary rows for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 * The table PK is (match_game_id, round_number, steam_id) so a full delete+reinsert
 * is the safest idempotency strategy rather than trying to upsert partial rows.
 */
export const saveRoundUtilitySummaryForGame = async ({
  matchGameId,
  entries,
  connection
}: SaveRoundUtilitySummaryParams): Promise<void> => {
  await runQuery(
    "DELETE FROM RoundUtilitySummary WHERE match_game_id = ?",
    [matchGameId],
    connection
  );

  if (!entries || entries.length === 0) return;

  const values = entries.map((e) => [
    matchGameId,
    e.round_number,
    String(e.steam_id),
    e.flashes_thrown,
    e.enemies_flashed,
    e.teammates_flashed,
    e.smokes_thrown,
    e.utility_damage,
    e.wasted_utility
  ]);

  const placeholders = values
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  await runQuery(
    `INSERT INTO RoundUtilitySummary (
      match_game_id, round_number, steam_id,
      flashes_thrown, enemies_flashed, teammates_flashed,
      smokes_thrown, utility_damage, wasted_utility
    ) VALUES ${placeholders}`,
    values.flat(),
    connection
  );
};
