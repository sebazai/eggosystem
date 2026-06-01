import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
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
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "WastedUtilityEvents",
    async () => {
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
    }
  );
};

/* ─────────────────────────────────────────────────────────
 *  Query: Wasted Utility by Player
 * ─────────────────────────────────────────────────────────*/

export interface WastedUtilityByPlayer {
  thrower_steam_id: string;
  utility_type: string;
  count: number;
}

export const getWastedUtilityByPlayer = async (
  match_game_id: number
): Promise<WastedUtilityByPlayer[]> => {
  const rows = await runQuery<
    {
      thrower_steam_id: string | number;
      utility_type: string;
      count: number;
    }[]
  >(
    `SELECT
      thrower_steam_id,
      utility_type,
      COUNT(*) AS count
    FROM WastedUtilityEvents
    WHERE match_game_id = ?
    GROUP BY thrower_steam_id, utility_type
    ORDER BY count DESC`,
    [match_game_id]
  );

  return rows.map((r) => ({
    thrower_steam_id: String(r.thrower_steam_id),
    utility_type: r.utility_type,
    count: r.count
  }));
};
