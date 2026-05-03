import type { Knex } from "knex";
import { formatDateForDatabase } from "../src/utils/date-utils";
import { isForfeitPayload } from "../src/utils/faceit-match-status-finished-detection";

interface WebhookTimingRow {
  id: number;
  external_payload_id: string;
  event: string;
  received_at: Date;
  data: unknown;
}

async function hasPriorSuccessfulReadyWebhook(
  knex: Knex,
  roomId: string,
  receivedAt: Date,
  rowId: number
): Promise<boolean> {
  const row = await knex("FaceitWebhooks")
    .select("id")
    .where("external_payload_id", roomId)
    .where("event", "match_status_ready")
    .whereNull("error_type")
    .whereRaw("(received_at < ? OR (received_at = ? AND id < ?))", [
      receivedAt,
      receivedAt,
      rowId
    ])
    .first();
  return row !== undefined;
}

/**
 * Season 17: align championship BO3+ hub match times with live webhook semantics —
 * ready-to-play `updated_at` drives start; finished preserves that start when a prior
 * ready webhook exists. Idempotent replay over FaceitWebhooks (championship only,
 * Matches.best_of >= 3 excludes 2×BO1 twin rows).
 */
export async function up(knex: Knex): Promise<void> {
  const [rowsUnknown] = await knex.raw(`
    SELECT fw.id, fw.external_payload_id, fw.event, fw.received_at, fw.data
    FROM FaceitWebhooks fw
    WHERE fw.error_type IS NULL
      AND fw.event IN ('match_status_ready', 'match_status_finished')
      AND JSON_UNQUOTE(JSON_EXTRACT(fw.data, '$.payload.entity.type')) = 'championship'
      AND EXISTS (
        SELECT 1 FROM Matches m
        WHERE m.external_match_room_id = fw.external_payload_id
          AND m.season_id = 17
          AND m.best_of >= 3
      )
    ORDER BY fw.received_at ASC, fw.id ASC
  `);
  const rows = rowsUnknown as WebhookTimingRow[];
  const roomsWithProcessedReady = new Set<string>();

  for (const row of rows) {
    const rawData = row.data;
    const data =
      typeof rawData === "string"
        ? (JSON.parse(rawData) as { payload?: Record<string, unknown> })
        : (rawData as { payload?: Record<string, unknown> });
    const payload = data?.payload;
    if (!payload || typeof payload !== "object") continue;

    const roomId = row.external_payload_id;

    if (row.event === "match_status_ready") {
      const updatedAt = payload.updated_at;
      if (typeof updatedAt !== "string") continue;
      await knex("Matches")
        .where({
          external_match_room_id: roomId,
          season_id: 17
        })
        .where("best_of", ">=", 3)
        .update({
          start_timestamp: formatDateForDatabase(updatedAt)
        });
      roomsWithProcessedReady.add(roomId);
    } else if (row.event === "match_status_finished") {
      if (isForfeitPayload(payload)) continue;

      const finishedAt = payload.finished_at;
      const startedAt = payload.started_at;
      if (typeof finishedAt !== "string" || typeof startedAt !== "string") {
        continue;
      }

      let hadReady = roomsWithProcessedReady.has(roomId);
      if (!hadReady) {
        hadReady = await hasPriorSuccessfulReadyWebhook(
          knex,
          roomId,
          row.received_at,
          row.id
        );
      }

      if (hadReady) {
        await knex("Matches")
          .where({
            external_match_room_id: roomId,
            season_id: 17
          })
          .where("best_of", ">=", 3)
          .update({
            end_timestamp: formatDateForDatabase(finishedAt),
            status: "FINISHED"
          });
      } else {
        await knex("Matches")
          .where({
            external_match_room_id: roomId,
            season_id: 17
          })
          .where("best_of", ">=", 3)
          .update({
            start_timestamp: formatDateForDatabase(startedAt),
            end_timestamp: formatDateForDatabase(finishedAt),
            status: "FINISHED"
          });
      }
    }
  }
}

export async function down(): Promise<void> {
  // Intentionally empty: data backfill cannot be safely reversed.
}
