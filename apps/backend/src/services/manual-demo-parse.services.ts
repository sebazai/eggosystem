import { createHash } from "node:crypto";
import { runQuery } from "../db/mysqlRunQuery";
import { getMatchIdByGameId } from "../models/match-game.models";
import { logger } from "../utils/app-logger";
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

/**
 * Safe audit/logging fingerprint for a demo URL (no full secret in logs or AuditLog.request_data).
 */
const fingerprintDemoUrlForAudit = (downloadUrl: string): DemoUrlAuditFingerprint => {
  const download_url_prefix = downloadUrl.slice(0, DEMO_URL_PREFIX_LEN);
  const download_url_sha256_hex = createHash("sha256")
    .update(downloadUrl, "utf8")
    .digest("hex");
  return { download_url_prefix, download_url_sha256_hex };
};

async function persistManualDemoEnqueueAudit(input: {
  matchGameId: number;
  actorAccountId: number;
  fingerprint: DemoUrlAuditFingerprint;
}): Promise<void> {
  const { matchGameId, actorAccountId, fingerprint } = input;
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

  await runQuery(
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
      200,
      "OK",
      "",
      JSON.stringify({
        source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE,
        enqueued_at: new Date().toISOString()
      })
    ]
  );
}

/**
 * Validates match game exists, publishes to parse_queue with source `dashboard-manual`,
 * then writes an audit row (URL never stored in full).
 * RabbitMQ failures propagate from {@link publishToParseQueue}.
 * Audit insert failures propagate after publish (caller gets an error response; generic `Error` defaults to 400 in the global Express handler unless `error.status` is set).
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

  await publishToParseQueue(parseMessage);

  const fingerprint = fingerprintDemoUrlForAudit(downloadUrl);
  logger.info("Manual dashboard demo enqueued to parse_queue", {
    actorAccountId,
    matchGameId,
    downloadUrlPrefix: fingerprint.download_url_prefix,
    downloadUrlSha256: fingerprint.download_url_sha256_hex,
    source: MANUAL_DASHBOARD_DEMO_PARSE_SOURCE
  });

  await persistManualDemoEnqueueAudit({
    matchGameId,
    actorAccountId,
    fingerprint
  });

  return { match_game_id: matchGameId };
};
