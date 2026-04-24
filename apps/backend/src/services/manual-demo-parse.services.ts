import { createHash } from "node:crypto";
import { runQuery } from "../db/mysqlRunQuery";
import { getMatchIdByGameId } from "../models/match-game.models";
import { logger } from "../utils/app-logger";
import { isErDupEntry } from "../utils/database-errors";
import { NotFoundError } from "../utils/errors";
import {
  createDemoProcessingRequest,
  publishToParseQueue
} from "./parse-queue.services";

/** Parse-queue `source` for staff-submitted demo URLs (issue #321 / #370). */
const MANUAL_DASHBOARD_DEMO_PARSE_SOURCE = "dashboard-manual";

const DEMO_URL_PREFIX_LEN = 64;

type DemoUrlAuditFingerprint = {
  download_url_prefix: string;
  download_url_sha256_hex: string;
};

type IdempotencyRow = {
  id: number;
  audit_log_id: number | null;
  rmq_published_at: string | Date | null;
  completed_at: string | Date | null;
};

/**
 * Safe audit/logging fingerprint for a demo URL (no full secret in logs or AuditLog.request_data).
 */
const fingerprintDemoUrlForAudit = (
  downloadUrl: string
): DemoUrlAuditFingerprint => {
  const download_url_prefix = downloadUrl.slice(0, DEMO_URL_PREFIX_LEN);
  const download_url_sha256_hex = createHash("sha256")
    .update(downloadUrl, "utf8")
    .digest("hex");
  return { download_url_prefix, download_url_sha256_hex };
};

const getIdempotencyByKey = async (input: {
  accountId: number;
  matchGameId: number;
  urlFingerprint: string;
}): Promise<IdempotencyRow | null> => {
  const rows = await runQuery<IdempotencyRow[]>(
    `SELECT id, audit_log_id, rmq_published_at, completed_at
     FROM ManualDemoParseIdempotency
     WHERE account_id = ? AND match_game_id = ? AND url_fingerprint = ?`,
    [input.accountId, input.matchGameId, input.urlFingerprint]
  );
  return rows[0] ?? null;
};

const insertIdempotencyRow = async (input: {
  accountId: number;
  matchGameId: number;
  urlFingerprint: string;
}): Promise<{ insertId: number }> => {
  const result = await runQuery<{ insertId: number }>(
    `INSERT INTO ManualDemoParseIdempotency (account_id, match_game_id, url_fingerprint)
     VALUES (?, ?, ?)`,
    [input.accountId, input.matchGameId, input.urlFingerprint]
  );
  if (typeof result.insertId !== "number" || result.insertId < 1) {
    throw new Error("Expected insertId from ManualDemoParseIdempotency insert");
  }
  return { insertId: result.insertId };
};

/**
 * Durable (actor, game, url) claim before RMQ; duplicate rows are resumed to avoid
 * duplicate parse_queue work when a late step fails and the client retries a 4xx/5xx.
 */
const claimOrLoadIdempotencyRow = async (input: {
  accountId: number;
  matchGameId: number;
  urlFingerprint: string;
}): Promise<
  { kind: "complete" } | { kind: "in_progress"; row: IdempotencyRow }
> => {
  try {
    const { insertId } = await insertIdempotencyRow(input);
    return {
      kind: "in_progress",
      row: {
        id: insertId,
        audit_log_id: null,
        rmq_published_at: null,
        completed_at: null
      }
    };
  } catch (err) {
    if (!isErDupEntry(err)) {
      throw err;
    }
    const row = await getIdempotencyByKey(input);
    if (!row) {
      throw new Error("Duplicate idempotency key but row not found", {
        cause: err
      });
    }
    if (row.completed_at != null) {
      return { kind: "complete" };
    }
    return { kind: "in_progress", row };
  }
};

const updateIdempotencySetAuditId = async (
  idempotencyId: number,
  auditLogId: number
): Promise<void> => {
  await runQuery(
    `UPDATE ManualDemoParseIdempotency SET audit_log_id = ? WHERE id = ?`,
    [auditLogId, idempotencyId]
  );
};

const updateIdempotencyRmqPublished = async (
  idempotencyId: number
): Promise<void> => {
  await runQuery(
    `UPDATE ManualDemoParseIdempotency SET rmq_published_at = NOW(3) WHERE id = ?`,
    [idempotencyId]
  );
};

const updateIdempotencyCompleted = async (
  idempotencyId: number
): Promise<void> => {
  await runQuery(
    `UPDATE ManualDemoParseIdempotency SET completed_at = NOW(3) WHERE id = ?`,
    [idempotencyId]
  );
};

async function insertPendingManualDemoEnqueueAudit(input: {
  matchGameId: number;
  actorAccountId: number;
  fingerprint: DemoUrlAuditFingerprint;
}): Promise<{ insertId: number }> {
  const { matchGameId, actorAccountId, fingerprint } = input;
  const requestPayload = {
    match_game_id: matchGameId,
    source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE,
    ...fingerprint
  };
  const responsePayload = {
    ok: false,
    match_game_id: matchGameId,
    source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE,
    stage: "before_parse_queue"
  };
  const metadata = JSON.stringify({
    source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE,
    stage: "pending"
  });

  const result = await runQuery<{ insertId: number }>(
    `
    INSERT INTO AuditLog (
      action_type,
      entity_type,
      entity_id,
      user_id,
      request_data,
      response_data,
      response_status,
      response_message,
      user_agent,
      metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      "POST /api/v1/dashboard/demos/manual/parse-queue",
      "MatchGames",
      matchGameId,
      actorAccountId,
      JSON.stringify(requestPayload),
      JSON.stringify(responsePayload),
      202,
      "Pending",
      "",
      metadata
    ]
  );
  if (typeof result.insertId !== "number" || result.insertId < 1) {
    throw new Error("Expected insertId from pending AuditLog insert");
  }
  return { insertId: result.insertId };
}

const finalizeManualDemoEnqueueAudit = async (input: {
  auditLogId: number;
  matchGameId: number;
  fingerprint: DemoUrlAuditFingerprint;
}): Promise<void> => {
  const { auditLogId, matchGameId, fingerprint } = input;
  const requestPayload = {
    match_game_id: matchGameId,
    source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE,
    ...fingerprint
  };
  const responsePayload = {
    ok: true,
    match_game_id: matchGameId,
    source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE
  };
  const metadata = JSON.stringify({
    source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE,
    enqueued_at: new Date().toISOString()
  });
  await runQuery(
    `
    UPDATE AuditLog
    SET
      request_data = ?,
      response_data = ?,
      response_status = ?,
      response_message = ?,
      user_agent = ?,
      metadata = ?
    WHERE id = ?
  /* manual-demo-parse-finalize */`,
    [
      JSON.stringify(requestPayload),
      JSON.stringify(responsePayload),
      200,
      "OK",
      "",
      metadata,
      auditLogId
    ]
  );
};

/**
 * Validates match game, claims idempotency, inserts a pending audit row (no RMQ) before parse_queue;
 * then publishes, marks idempotency + finalizes the audit. RabbitMQ and DB failures are not silently
 * treated as success.
 */
export const enqueueManualDashboardDemoParse = async (input: {
  matchGameId: number;
  downloadUrl: string;
  priority: number;
  actorAccountId: number;
}): Promise<{ match_game_id: number }> => {
  const { matchGameId, downloadUrl, priority, actorAccountId } = input;

  const matchRows = await getMatchIdByGameId(matchGameId);
  const matchRow = matchRows[0];
  if (!matchRow?.match_id) {
    throw new NotFoundError("Match game not found");
  }

  const parseMessage = createDemoProcessingRequest(
    matchGameId,
    downloadUrl,
    priority,
    MANUAL_DASHBOARD_DEMO_PARSE_SOURCE,
    false
  );

  const fingerprint = fingerprintDemoUrlForAudit(downloadUrl);

  const idem = await claimOrLoadIdempotencyRow({
    accountId: actorAccountId,
    matchGameId,
    urlFingerprint: fingerprint.download_url_sha256_hex
  });

  if (idem.kind === "complete") {
    logger.info(
      "Manual dashboard demo parse enqueue: idempotent (already completed)",
      {
        actorAccountId,
        matchGameId
      }
    );
    return { match_game_id: matchGameId };
  }

  let { row } = idem;
  if (row.audit_log_id == null) {
    const pending = await insertPendingManualDemoEnqueueAudit({
      matchGameId,
      actorAccountId,
      fingerprint
    });
    await updateIdempotencySetAuditId(row.id, pending.insertId);
    row = { ...row, audit_log_id: pending.insertId };
  }

  if (row.rmq_published_at == null) {
    await publishToParseQueue(parseMessage);
    await updateIdempotencyRmqPublished(row.id);
    row = { ...row, rmq_published_at: new Date() };
    logger.info("Manual dashboard demo enqueued to parse_queue", {
      actorAccountId,
      matchGameId,
      downloadUrlPrefix: fingerprint.download_url_prefix,
      downloadUrlSha256: fingerprint.download_url_sha256_hex,
      source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE
    });
  }

  if (row.audit_log_id == null) {
    throw new Error("Invariant: audit row missing after idempotency steps");
  }
  if (row.completed_at == null) {
    await finalizeManualDemoEnqueueAudit({
      auditLogId: row.audit_log_id,
      matchGameId,
      fingerprint
    });
    await updateIdempotencyCompleted(row.id);
  }

  return { match_game_id: matchGameId };
};
