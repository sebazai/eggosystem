import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type FlashEvent } from "../types/parse-queue.types";

interface SaveFlashEventsParams {
  matchGameId: number;
  events: FlashEvent[];
  connection: PoolConnection;
}

/**
 * Replaces all flash events for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 */
export const saveFlashEventsForGame = async ({
  matchGameId,
  events,
  connection
}: SaveFlashEventsParams): Promise<void> => {
  await runQuery(
    "DELETE FROM FlashEvents WHERE match_game_id = ?",
    [matchGameId],
    connection
  );

  if (!events || events.length === 0) return;

  const values = events.map((e) => [
    matchGameId,
    e.round_number,
    e.time_in_round,
    String(e.thrower),
    e.thrower_team,
    String(e.victim),
    e.victim_team,
    e.duration_seconds,
    e.is_enemy_flash ? 1 : 0,
    e.is_teammate_flash ? 1 : 0,
    e.is_self_flash ? 1 : 0
  ]);

  const placeholders = values
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  await runQuery(
    `INSERT INTO FlashEvents (
      match_game_id, round_number, time_in_round,
      thrower_steam_id, thrower_team, victim_steam_id, victim_team,
      duration_seconds, is_enemy_flash, is_teammate_flash, is_self_flash
    ) VALUES ${placeholders}`,
    values.flat(),
    connection
  );
};
