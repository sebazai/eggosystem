import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type SetupEvent } from "../types/parse-queue.types";

interface SaveSetupEventsParams {
  matchGameId: number;
  events: SetupEvent[];
  connection: PoolConnection;
}

/**
 * Replaces all setup events for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 */
export const saveSetupEventsForGame = async ({
  matchGameId,
  events,
  connection
}: SaveSetupEventsParams): Promise<void> => {
  await runQuery(
    "DELETE FROM SetupEvents WHERE match_game_id = ?",
    [matchGameId],
    connection
  );

  if (!events || events.length === 0) return;

  const values = events.map((e) => [
    matchGameId,
    e.round_number,
    e.time_in_round,
    e.setup_type,
    String(e.setup_player),
    String(e.beneficiary),
    String(e.victim),
    e.seconds_after_setup,
    e.flash_duration ?? null,
    e.damage_dealt ?? null
  ]);

  const placeholders = values
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  await runQuery(
    `INSERT INTO SetupEvents (
      match_game_id, round_number, time_in_round,
      setup_type, setup_player_steam_id, beneficiary_steam_id, victim_steam_id,
      seconds_after_setup, flash_duration, damage_dealt
    ) VALUES ${placeholders}`,
    values.flat(),
    connection
  );
};
