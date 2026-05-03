import type { Knex } from "knex";

import {
  computeSeason17Bo3FinishedMatchPatch,
  computeSeason17Bo3ReadyMatchPatch,
  hasPriorSuccessfulReadyWebhook,
  parseWebhookDataPayload
} from "../src/utils/season-17-bo3-championship-hub-timing-backfill";

interface WebhookTimingRow {
  id: number;
  external_payload_id: string;
  event: string;
  received_at: Date;
  data: unknown;
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
    const payload = parseWebhookDataPayload(row.data);
    if (!payload) continue;

    const roomId = row.external_payload_id;

    if (row.event === "match_status_ready") {
      const patch = computeSeason17Bo3ReadyMatchPatch(payload);
      if (!patch) continue;
      await knex("Matches")
        .where({
          external_match_room_id: roomId,
          season_id: 17
        })
        .where("best_of", ">=", 3)
        .update(patch);
      roomsWithProcessedReady.add(roomId);
    } else if (row.event === "match_status_finished") {
      let hadReady = roomsWithProcessedReady.has(roomId);
      if (!hadReady) {
        hadReady = await hasPriorSuccessfulReadyWebhook(
          knex,
          roomId,
          row.received_at,
          row.id
        );
      }

      const result = computeSeason17Bo3FinishedMatchPatch(payload, hadReady);
      if (result.action === "skip") continue;

      await knex("Matches")
        .where({
          external_match_room_id: roomId,
          season_id: 17
        })
        .where("best_of", ">=", 3)
        .update(result.patch);
    }
  }
}

export async function down(): Promise<void> {
  // Intentionally empty: data backfill cannot be safely reversed.
}
