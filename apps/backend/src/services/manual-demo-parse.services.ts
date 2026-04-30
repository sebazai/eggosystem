import { createHash } from "node:crypto";
import type {
  ManualDemoParseMarkFinishedResult,
  Match
} from "@eggosystem/types";
import { MatchStatus } from "@eggosystem/types";

const MARK_FINISHED_NOT_REQUESTED_SKIP = "not_requested";
import type { PoolConnection } from "mysql2/promise";
import moment from "moment-timezone";
import { getConnection } from "../db/mysqlConnection";
import { runQuery } from "../db/mysqlRunQuery";
import { getMatchIdByGameId } from "../models/match-game.models";
import { logger } from "../utils/app-logger";
import { NotFoundError } from "../utils/errors";
import { formatDateForDatabase } from "../utils/date-utils";
import {
  createDemoProcessingRequest,
  publishToParseQueue
} from "./parse-queue.services";

type ManualDemoParseSource = "manual" | "faceit";

const MARK_FINISHED_NOT_REQUESTED_SKIP = "not_requested";
const DEMO_URL_PREFIX_LEN = 64;

type DemoUrlLogFingerprint = {
  download_url_prefix: string;
  download_url_sha256_hex: string;
};

/**
 * Safe logging fingerprint for a demo URL (avoid putting full URL in logs).
 */
const fingerprintDemoUrlForLog = (
  downloadUrl: string
): DemoUrlLogFingerprint => {
  const download_url_prefix = downloadUrl.slice(0, DEMO_URL_PREFIX_LEN);
  const download_url_sha256_hex = createHash("sha256")
    .update(downloadUrl, "utf8")
    .digest("hex");
  return { download_url_prefix, download_url_sha256_hex };
};

function manualParseMarkFinishedNotRequested(): ManualDemoParseMarkFinishedResult {
  return {
    applied: false,
    match_ids: [],
    end_timestamp: null,
    skipped_reason: MARK_FINISHED_NOT_REQUESTED_SKIP
  };
}

/**
 * Loads `Matches` rows for {@link finishMatchWithComputedEndTime} in stable id order.
 */
async function loadMatchesForComputedFinishByIds(
  matchIds: number[],
  conn: PoolConnection
): Promise<FinishMatchWithComputedEndTimeRowInput[]> {
  const uniqueSorted = [...new Set(matchIds)].sort((a, b) => a - b);
  if (uniqueSorted.length === 0) return [];

  const placeholders = uniqueSorted.map(() => "?").join(", ");
  const rows = await runQuery<
    Array<{
      id: number;
      start_timestamp: string | Date | null;
      best_of: unknown;
      status: Match["status"];
    }>
  >(
    `SELECT id, start_timestamp, best_of, status FROM Matches WHERE id IN (${placeholders})`,
    uniqueSorted,
    conn
  );
  const byId = new Map(rows.map((r) => [r.id, r]));
  return uniqueSorted
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<(typeof rows)[number]> => row != null);
}

/**
 * Validates match game then publishes to parse_queue. RabbitMQ failures are not silently treated as
 * success.
 */
export const enqueueManualDashboardDemoParse = async (input: {
  matchGameId: number;
  downloadUrl: string;
  priority: number;
  actorAccountId: number;
  source: ManualDemoParseSource;
  reparse: boolean;
  /**
   * When set and `mark_finished` is true, these internal `Matches.id` values are marked finished.
   * Omitted/`undefined` ⇒ derive from {@link getMatchIdByGameId}.
   */
  finishMatchIds?: number[];
  mark_finished?: boolean;
}): Promise<{
  match_game_id: number;
  mark_finished: ManualDemoParseMarkFinishedResult;
}> => {
  const {
    matchGameId,
    downloadUrl,
    priority,
    actorAccountId,
    source,
    reparse,
    finishMatchIds,
    mark_finished: markFinished = false
  } = input;

  const matchRows = await getMatchIdByGameId(matchGameId);
  const matchRow = matchRows[0];
  if (!matchRow?.match_id) {
    throw new NotFoundError("Match game not found");
  }

  const parseMessage = createDemoProcessingRequest(
    matchGameId,
    downloadUrl,
    priority,
    source,
    reparse
  );

  const fingerprint = fingerprintDemoUrlForLog(downloadUrl);
  await publishToParseQueue(parseMessage);
  logger.info("Manual dashboard demo enqueued to parse_queue", {
    actorAccountId,
    matchGameId,
    downloadUrlPrefix: fingerprint.download_url_prefix,
    downloadUrlSha256: fingerprint.download_url_sha256_hex,
    source
  });

  if (!markFinished) {
    return {
      match_game_id: matchGameId,
      mark_finished: manualParseMarkFinishedNotRequested()
    };
  }

  const targetIdsRaw =
    finishMatchIds !== undefined && finishMatchIds.length > 0
      ? finishMatchIds
      : [matchRow.match_id];
  const targetIdsSorted = [...new Set(targetIdsRaw)].sort((a, b) => a - b);

  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const rows = await loadMatchesForComputedFinishByIds(targetIdsSorted, conn);
    if (rows.length !== targetIdsSorted.length) {
      await conn.rollback();
      return {
        match_game_id: matchGameId,
        mark_finished: validationResult(
          `Could not load all Matches rows for ids: ${targetIdsSorted.join(", ")}.`
        )
      };
    }

    const finishResult = await finishMatchWithComputedEndTime(rows, {
      connection: conn
    });
    await conn.commit();
    return {
      match_game_id: matchGameId,
      mark_finished: finishResult
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Resolved `Matches` row shape for {@link finishMatchWithComputedEndTime}.
 */
interface FinishMatchWithComputedEndTimeRowInput {
  id: number;
  start_timestamp: string | Date | null | undefined;
  best_of: unknown;
  status: Match["status"];
}

function validationResult(
  skippedReason: string
): ManualDemoParseMarkFinishedResult {
  return {
    applied: false,
    match_ids: [],
    end_timestamp: null,
    skipped_reason: skippedReason
  };
}

function normalizeStartTimestampToIso(
  value: string | Date | null | undefined
): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function isValidBestOf(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 255
  );
}

/**
 * Marks match rows as FINISHED with `end_timestamp = start_timestamp + best_of` hours (UTC).
 * Rows already FINISHED or FORFEIT are skipped. Multiple rows are updated in a single transaction
 * when this function allocates the connection (2×BO1 / hub room).
 */
export async function finishMatchWithComputedEndTime(
  matches: FinishMatchWithComputedEndTimeRowInput[],
  options?: { connection?: PoolConnection }
): Promise<ManualDemoParseMarkFinishedResult> {
  if (matches.length === 0) {
    return validationResult("No match rows were provided.");
  }

  const seenIds = new Set<number>();
  const normalized: Array<{
    id: number;
    startIso: string;
    best_of: number;
    status: Match["status"];
  }> = [];

  for (const row of matches) {
    if (seenIds.has(row.id)) {
      return validationResult(`Duplicate match id ${row.id} in input.`);
    }
    seenIds.add(row.id);

    if (!Number.isInteger(row.id) || row.id < 1) {
      return validationResult(`Invalid match id: ${String(row.id)}.`);
    }

    const startIso = normalizeStartTimestampToIso(row.start_timestamp);
    if (!startIso) {
      return validationResult(
        `Invalid or missing start_timestamp for match id ${row.id}.`
      );
    }

    if (!isValidBestOf(row.best_of)) {
      return validationResult(
        `Invalid best_of for match id ${row.id} (expected integer 1–255).`
      );
    }

    normalized.push({
      id: row.id,
      startIso,
      best_of: row.best_of,
      status: row.status
    });
  }

  const eligible = normalized.filter(
    (row) =>
      row.status !== MatchStatus.FINISHED && row.status !== MatchStatus.FORFEIT
  );

  if (eligible.length === 0) {
    return validationResult(
      "All matches are already FINISHED or FORFEIT; no update applied."
    );
  }

  const externalConnection = options?.connection;
  const conn = externalConnection ?? (await getConnection());
  const ownTransaction = externalConnection === undefined;

  if (ownTransaction) {
    await conn.beginTransaction();
  }

  try {
    const appliedIds: number[] = [];
    const endTimestamps: string[] = [];

    for (const row of eligible) {
      const endIso = moment
        .utc(row.startIso)
        .add(row.best_of, "hours")
        .toISOString();
      const updateResult = await runQuery<{ affectedRows: number }>(
        `UPDATE Matches SET status = ?, end_timestamp = ? WHERE id = ? AND status NOT IN ('FINISHED', 'FORFEIT')`,
        [MatchStatus.FINISHED, formatDateForDatabase(endIso), row.id],
        conn
      );
      if (updateResult.affectedRows > 0) {
        appliedIds.push(row.id);
        endTimestamps.push(endIso);
      }
    }

    if (appliedIds.length === 0) {
      if (ownTransaction) {
        await conn.rollback();
      }
      return validationResult(
        "No rows were updated; matches may have been finished by another request."
      );
    }

    if (ownTransaction) {
      await conn.commit();
    }

    const uniqueEnds = [...new Set(endTimestamps)];
    const end_timestamp =
      uniqueEnds.length === 1 ? uniqueEnds[0] : (endTimestamps[0] ?? null);

    logger.info("finishMatchWithComputedEndTime applied", {
      match_ids: appliedIds,
      end_timestamp
    });

    return {
      applied: true,
      match_ids: appliedIds,
      end_timestamp,
      skipped_reason: null
    };
  } catch (err) {
    if (ownTransaction) {
      await conn.rollback();
    }
    throw err;
  } finally {
    if (ownTransaction) {
      conn.release();
    }
  }
}
