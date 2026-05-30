import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type WastedUtilityEvent } from "../types/parse-queue.types";

interface SaveWastedUtilityEventsParams {
  matchGameId: number;
  events: WastedUtilityEvent[];
  connection: PoolConnection;
}

/**
 * Replaces all wasted utility events for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 */
export const saveWastedUtilityEventsForGame = async ({
  matchGameId,
  events,
  connection
}: SaveWastedUtilityEventsParams): Promise<void> => {
  await runQuery(
    "DELETE FROM WastedUtilityEvents WHERE match_game_id = ?",
    [matchGameId],
    connection
  );

  if (!events || events.length === 0) return;

  const values = events.map((e) => [
    matchGameId,
    e.round_number,
    e.time_in_round,
    String(e.thrower),
    e.utility_type
  ]);

  const placeholders = values.map(() => "(?, ?, ?, ?, ?)").join(", ");

  await runQuery(
    `INSERT INTO WastedUtilityEvents (
      match_game_id, round_number, time_in_round,
      thrower_steam_id, utility_type
    ) VALUES ${placeholders}`,
    values.flat(),
    connection
  );
};
