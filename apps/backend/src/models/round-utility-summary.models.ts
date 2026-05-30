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

/* ─────────────────────────────────────────────────────────
 *  Query: Round Utility Summary
 * ─────────────────────────────────────────────────────────*/

export interface RoundUtilitySummaryRow {
  round_number: number;
  steam_id: string;
  flashes_thrown: number;
  enemies_flashed: number;
  teammates_flashed: number;
  smokes_thrown: number;
  utility_damage: number;
  wasted_utility: number;
}

export const getRoundUtilitySummary = async (
  match_game_id: number
): Promise<RoundUtilitySummaryRow[]> => {
  const rows = await runQuery<
    {
      round_number: number;
      steam_id: string | number;
      flashes_thrown: number;
      enemies_flashed: number;
      teammates_flashed: number;
      smokes_thrown: number;
      utility_damage: number;
      wasted_utility: number;
    }[]
  >(
    `SELECT
      round_number,
      steam_id,
      flashes_thrown,
      enemies_flashed,
      teammates_flashed,
      smokes_thrown,
      utility_damage,
      wasted_utility
    FROM RoundUtilitySummary
    WHERE match_game_id = ?
    ORDER BY round_number ASC, steam_id ASC`,
    [match_game_id]
  );

  return rows.map((r) => ({
    round_number: r.round_number,
    steam_id: String(r.steam_id),
    flashes_thrown: r.flashes_thrown,
    enemies_flashed: r.enemies_flashed,
    teammates_flashed: r.teammates_flashed,
    smokes_thrown: r.smokes_thrown,
    utility_damage: r.utility_damage,
    wasted_utility: r.wasted_utility
  }));
};
