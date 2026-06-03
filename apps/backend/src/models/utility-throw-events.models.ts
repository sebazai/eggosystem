import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { type UtilityThrowEvent } from "../types/parse-queue.types";

interface SaveUtilityThrowEventsParams {
  matchGameId: number;
  events: UtilityThrowEvent[];
  connection: PoolConnection;
}

/**
 * Replaces all utility throw events for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 */
export const saveUtilityThrowEventsForGame = async ({
  matchGameId,
  events,
  connection
}: SaveUtilityThrowEventsParams): Promise<void> => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "UtilityThrowEvents",
    async () => {
      if (!events || events.length === 0) return;

      const values = events.map((e) => [
        matchGameId,
        e.round_number,
        e.time_in_round,
        String(e.thrower),
        e.thrower_team,
        e.utility_type
      ]);

      const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");

      await runQuery(
        `INSERT INTO UtilityThrowEvents (
          match_game_id, round_number, time_in_round,
          thrower_steam_id, thrower_team, utility_type
        ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};

export interface UtilityThrowEventRow {
  round_number: number;
  time_in_round: number;
  utility_type: string;
}

export const getUtilityThrowsByPlayer = async (
  match_game_id: number,
  steam_id: string
): Promise<UtilityThrowEventRow[]> => {
  const rows = await runQuery<
    {
      round_number: number;
      time_in_round: number | string;
      utility_type: string;
    }[]
  >(
    `SELECT round_number,
            time_in_round,
            utility_type
     FROM UtilityThrowEvents
     WHERE match_game_id = ? AND thrower_steam_id = ?
     ORDER BY round_number, time_in_round`,
    [match_game_id, steam_id]
  );

  return rows.map((r) => ({
    round_number: Number(r.round_number),
    time_in_round: Number(r.time_in_round),
    utility_type: r.utility_type
  }));
};
