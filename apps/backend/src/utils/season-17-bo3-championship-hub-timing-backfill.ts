import type { Knex } from "knex";
import { z } from "zod";

import { formatDateForDatabase } from "./date-utils";
import { isForfeitPayload } from "./faceit-match-status-finished-detection";

const webhookDataEnvelopeSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional()
});

/**
 * Shared logic for Season 17 championship BO3+ hub timing backfill (migration replay)
 * and live {@link handleFaceitWebhook} semantics: ready `updated_at` → start; finished
 * with prior ready → end-only; else finished sets start+end.
 */

export function parseWebhookDataPayload(
  rawData: unknown
): Record<string, unknown> | null {
  let envelope: unknown;
  if (typeof rawData === "string") {
    try {
      envelope = JSON.parse(rawData);
    } catch {
      return null;
    }
  } else {
    envelope = rawData;
  }
  const parsed = webhookDataEnvelopeSchema.safeParse(envelope);
  if (!parsed.success) return null;
  const { payload } = parsed.data;
  if (payload === undefined) return null;
  return payload;
}

function startedAtForForfeitCheck(
  payload: Record<string, unknown>
): string | null | undefined {
  const s = payload.started_at;
  if (s === undefined) return undefined;
  if (s === null) return null;
  if (typeof s === "string") return s;
  return undefined;
}

export function computeSeason17Bo3ReadyMatchPatch(
  payload: Record<string, unknown>
): { start_timestamp: string } | null {
  const updatedAt = payload.updated_at;
  if (typeof updatedAt !== "string") return null;
  return { start_timestamp: formatDateForDatabase(updatedAt) };
}

type Season17Bo3FinishedBackfillResult =
  | { action: "skip" }
  | {
      action: "update_end_only";
      patch: { end_timestamp: string; status: "FINISHED" };
    }
  | {
      action: "update_full";
      patch: {
        start_timestamp: string;
        end_timestamp: string;
        status: "FINISHED";
      };
    };

export function computeSeason17Bo3FinishedMatchPatch(
  payload: Record<string, unknown>,
  hadReady: boolean
): Season17Bo3FinishedBackfillResult {
  if (isForfeitPayload({ started_at: startedAtForForfeitCheck(payload) })) {
    return { action: "skip" };
  }

  const finishedAt = payload.finished_at;
  const startedAt = payload.started_at;
  if (typeof finishedAt !== "string" || typeof startedAt !== "string") {
    return { action: "skip" };
  }

  if (hadReady) {
    return {
      action: "update_end_only",
      patch: {
        end_timestamp: formatDateForDatabase(finishedAt),
        status: "FINISHED"
      }
    };
  }

  return {
    action: "update_full",
    patch: {
      start_timestamp: formatDateForDatabase(startedAt),
      end_timestamp: formatDateForDatabase(finishedAt),
      status: "FINISHED"
    }
  };
}

export async function hasPriorSuccessfulReadyWebhook(
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
