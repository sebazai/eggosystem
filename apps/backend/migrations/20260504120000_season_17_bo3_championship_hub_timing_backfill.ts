import type { Knex } from "knex";

interface WebhookTimingRow {
  id: number;
  external_payload_id: string;
  event: "match_status_ready" | "match_status_finished";
  received_at: Date;
  data: unknown;
}

const FACEIT_FORFEIT_STARTED_AT = "1970-01-01T00:00:00Z" as const;

/**
 * MySQL datetime in UTC. Mirrors {@link formatDateForDatabase} in app code: strings
 * without a timezone suffix are interpreted as UTC (not host-local).
 * Kept self-contained so the migration image does not need moment or zod.
 */
function stringToUtcDate(value: string): Date {
  const t = value.trim();
  if (/Z$/i.test(t)) return new Date(t);
  if (/[+-]\d{2}:\d{2}$/.test(t) || /[+-]\d{4}$/.test(t)) return new Date(t);
  const normalized = t.includes("T") ? t : t.replace(" ", "T");
  return new Date(`${normalized}Z`);
}

function formatDateForDatabase(utcDate: Date | string): string {
  const d = typeof utcDate === "string" ? stringToUtcDate(utcDate) : utcDate;
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${String(utcDate)}`);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function isForfeitPayload(payload: { started_at?: string | null }): boolean {
  return payload.started_at === FACEIT_FORFEIT_STARTED_AT;
}

/**
 * Shared logic for Season 17 championship BO3+ hub timing backfill (migration replay)
 * and live {@link handleFaceitWebhook} semantics: first ready `updated_at` → start;
 * finished with prior ready → end-only; else finished sets start+end.
 */

function parseWebhookDataPayload(
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
  if (!isRecord(envelope)) return null;
  if (!("payload" in envelope)) return null;
  const { payload } = envelope;
  if (payload === undefined) return null;
  if (!isRecord(payload)) return null;
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

function computeSeason17Bo3ReadyMatchPatch(
  payload: Record<string, unknown>
): { start_timestamp: string } | null {
  const updatedAt = payload.updated_at;
  if (typeof updatedAt !== "string") return null;
  return {
    start_timestamp: formatDateForDatabase(updatedAt)
  };
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

function computeSeason17Bo3FinishedMatchPatch(
  payload: Record<string, unknown>,
  hadReady: boolean
): Season17Bo3FinishedBackfillResult {
  if (isForfeitPayload({ started_at: startedAtForForfeitCheck(payload) })) {
    return { action: "skip" };
  }

  const startedAt = payload.started_at;
  const finishedAt = payload.finished_at;
  if (typeof startedAt !== "string" || typeof finishedAt !== "string") {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseRowId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function parseReceivedAt(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toWebhookTimingRow(row: unknown): WebhookTimingRow | null {
  if (!isRecord(row)) return null;
  const id = parseRowId(row.id);
  if (id === null) return null;
  const externalPayloadId = row.external_payload_id;
  if (typeof externalPayloadId !== "string") return null;
  const event = row.event;
  if (event !== "match_status_ready" && event !== "match_status_finished") {
    return null;
  }
  const receivedAt = parseReceivedAt(row.received_at);
  if (receivedAt === null) return null;
  if (!("data" in row)) return null;
  return {
    id,
    external_payload_id: externalPayloadId,
    event,
    received_at: receivedAt,
    data: row.data
  };
}

/**
 * Season 17: align championship BO3+ hub match times with live webhook semantics —
 * the first successful ready-to-play `updated_at` drives start (later map readies do
 * not move start); finished preserves that start when a prior ready webhook exists.
 * Idempotent replay over FaceitWebhooks (championship only, Matches.best_of >= 3
 * excludes 2×BO1 twin rows).
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
  const rawRows = Array.isArray(rowsUnknown) ? rowsUnknown : [];
  const rows: WebhookTimingRow[] = [];
  for (const row of rawRows) {
    const normalized = toWebhookTimingRow(row);
    if (normalized) rows.push(normalized);
  }
  const roomsWithProcessedReady = new Set<string>();
  const roomsWithFirstReadyStartApplied = new Set<string>();

  for (const row of rows) {
    const payload = parseWebhookDataPayload(row.data);
    if (!payload) continue;

    const roomId = row.external_payload_id;

    if (row.event === "match_status_ready") {
      const patch = computeSeason17Bo3ReadyMatchPatch(payload);
      if (!patch) continue;
      if (!roomsWithFirstReadyStartApplied.has(roomId)) {
        await knex("Matches")
          .where({
            external_match_room_id: roomId,
            season_id: 17
          })
          .where("best_of", ">=", 3)
          .update(patch);
        roomsWithFirstReadyStartApplied.add(roomId);
      }
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
