import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { type RoundSwingEvent } from "../types/parse-queue.types";

interface SaveRoundSwingEventsParams {
  matchGameId: number;
  events: RoundSwingEvent[];
  connection: PoolConnection;
}

/**
 * Replaces all round swing events for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 * Contributors are stored as a JSON string in a JSON column.
 */
export const saveRoundSwingEventsForGame = async ({
  matchGameId,
  events,
  connection
}: SaveRoundSwingEventsParams): Promise<void> => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "RoundSwingEvents",
    async () => {
      if (!events || events.length === 0) return;

      const values = events.map((e) => [
        matchGameId,
        e.round_number,
        e.time_in_round,
        e.event_type,
        e.pre_win_prob,
        e.post_win_prob,
        String(e.primary_player),
        JSON.stringify(
          (e.contributors ?? []).map((c) => ({
            steam_id: String(c.steam_id),
            contribution: c.contribution
          }))
        )
      ]);

      const placeholders = values
        .map(() => "(?, ?, ?, ?, ?, ?, ?, ?)")
        .join(", ");

      await runQuery(
        `INSERT INTO RoundSwingEvents (
          match_game_id, round_number, time_in_round,
          event_type, pre_win_prob, post_win_prob,
          primary_player_steam_id, contributors
        ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};
