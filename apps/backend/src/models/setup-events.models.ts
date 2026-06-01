import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
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
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "SetupEvents",
    async () => {
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
    }
  );
};

/* ─────────────────────────────────────────────────────────
 *  Query: Setup Pairs
 * ─────────────────────────────────────────────────────────*/

export interface SetupPair {
  setup_player_steam_id: string;
  beneficiary_steam_id: string;
  setup_type: string;
  count: number;
  avg_seconds_after_setup: number;
}

export const getSetupPairs = async (
  match_game_id: number
): Promise<SetupPair[]> => {
  const rows = await runQuery<
    {
      setup_player_steam_id: string | number;
      beneficiary_steam_id: string | number;
      setup_type: string;
      count: number;
      avg_seconds_after_setup: number;
    }[]
  >(
    `SELECT
      setup_player_steam_id,
      beneficiary_steam_id,
      setup_type,
      COUNT(*) AS count,
      AVG(seconds_after_setup) AS avg_seconds_after_setup
    FROM SetupEvents
    WHERE match_game_id = ?
    GROUP BY setup_player_steam_id, beneficiary_steam_id, setup_type
    ORDER BY count DESC`,
    [match_game_id]
  );

  return rows.map((r) => ({
    setup_player_steam_id: String(r.setup_player_steam_id),
    beneficiary_steam_id: String(r.beneficiary_steam_id),
    setup_type: r.setup_type,
    count: r.count,
    avg_seconds_after_setup: r.avg_seconds_after_setup
  }));
};
