import { createHash } from "node:crypto";
import type {
  ManualDemoParseMarkFinishedResult,
  ManualDemoParsePlacementsResult,
  Match
} from "@eggosystem/types";
import { MatchStatus } from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";
import moment from "moment-timezone";
import { getConnection } from "../db/mysqlConnection";
import { runQuery } from "../db/mysqlRunQuery";
import {
  getMatchIdByGameId,
  isChampionshipMatchGame
} from "../models/match-game.models";
import { sendDemoForAllStarPOTGClip } from "./allstar.services";
import { logger } from "../utils/app-logger";
import { NotFoundError } from "../utils/errors";
import { formatDateForDatabase } from "../utils/date-utils";
import {
  createDemoProcessingRequest,
  publishToParseQueue
} from "./parse-queue.services";
import {
  assignGrandFinalPlacementsForFinishedMatch,
  type AssignGrandFinalPlacementsResult
} from "./placements.services";

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

function manualParsePlacementsNotRequested(): ManualDemoParsePlacementsResult {
  return {
    applied: false,
    skipped_reason: MARK_FINISHED_NOT_REQUESTED_SKIP,
    season_id: null,
    league_id: null,
    updated: []
  };
}

// ManualDemoParsePlacementsResult is a separate public API type even though its
// fields currently mirror AssignGrandFinalPlacementsResult. The internal result
// type is free to evolve without affecting the wire contract.
function toManualParsePlacementsResult(
  result: AssignGrandFinalPlacementsResult
): ManualDemoParsePlacementsResult {
  return {
    applied: result.applied,
    skipped_reason: result.skipped_reason,
    season_id: result.season_id,
    league_id: result.league_id,
    updated: result.updated
  };
}

function placementsFromMarkFinishedSkipped(
  markFinished: ManualDemoParseMarkFinishedResult
): ManualDemoParsePlacementsResult {
  return {
    applied: false,
    skipped_reason: markFinished.skipped_reason ?? "mark_finished_not_applied",
    season_id: null,
    league_id: null,
    updated: []
  };
}

type MatchRowForPlacements = Pick<
  Match,
  | "id"
  | "group"
  | "round"
  | "external_match_room_id"
  | "season_id"
  | "league_id"
  | "stage"
>;

async function loadMatchesForPlacementsByIds(
  matchIds: number[],
  conn: PoolConnection
): Promise<MatchRowForPlacements[]> {
  const uniqueSorted = [...new Set(matchIds)].sort((a, b) => a - b);
  if (uniqueSorted.length === 0) return [];

  const placeholders = uniqueSorted.map(() => "?").join(", ");
  return runQuery<MatchRowForPlacements[]>(
    `SELECT id, \`group\`, round, external_match_room_id, season_id, league_id, stage
     FROM Matches WHERE id IN (${placeholders})`,
    uniqueSorted,
    conn
  );
}

async function assignPlacementsAfterManualMarkFinished(
  markFinished: ManualDemoParseMarkFinishedResult,
  conn: PoolConnection
): Promise<ManualDemoParsePlacementsResult> {
  if (!markFinished.applied || markFinished.match_ids.length === 0) {
    return placementsFromMarkFinishedSkipped(markFinished);
  }

  const matches = await loadMatchesForPlacementsByIds(
    markFinished.match_ids,
    conn
  );

  let lastNonGrandFinal: AssignGrandFinalPlacementsResult | null = null;
  for (const match of matches) {
    const result = await assignGrandFinalPlacementsForFinishedMatch(match);
    if (result.applied) {
      return toManualParsePlacementsResult(result);
    }
    if (result.skipped_reason !== "not_grand_final") {
      lastNonGrandFinal = result;
    }
  }

  if (lastNonGrandFinal != null) {
    return toManualParsePlacementsResult(lastNonGrandFinal);
  }

  const firstMatch = matches[0];
  return {
    applied: false,
    skipped_reason: "not_grand_final",
    season_id: firstMatch?.season_id ?? null,
    league_id: firstMatch?.league_id ?? null,
    updated: []
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
  force_finish_forfeit?: boolean;
}): Promise<{
  match_game_id: number;
  mark_finished: ManualDemoParseMarkFinishedResult;
  placements: ManualDemoParsePlacementsResult;
}> => {
  const {
    matchGameId,
    downloadUrl,
    priority,
    actorAccountId,
    source,
    reparse,
    finishMatchIds,
    mark_finished: markFinished = false,
    force_finish_forfeit: forceFinishForfeit = false
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
  const [, isChampionship] = await Promise.all([
    publishToParseQueue(parseMessage),
    isChampionshipMatchGame(matchGameId)
  ]);
  logger.info("Manual dashboard demo enqueued to parse_queue", {
    actorAccountId,
    matchGameId,
    downloadUrlPrefix: fingerprint.download_url_prefix,
    downloadUrlSha256: fingerprint.download_url_sha256_hex,
    source
  });

  if (isChampionship) {
    await sendDemoForAllStarPOTGClip(matchGameId, downloadUrl);
  }

  if (!markFinished) {
    return {
      match_game_id: matchGameId,
      mark_finished: manualParseMarkFinishedNotRequested(),
      placements: manualParsePlacementsNotRequested()
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
      const markFinishedResult = validationResult(
        `Could not load all Matches rows for ids: ${targetIdsSorted.join(", ")}.`
      );
      return {
        match_game_id: matchGameId,
        mark_finished: markFinishedResult,
        placements: placementsFromMarkFinishedSkipped(markFinishedResult)
      };
    }

    const finishResult = await finishMatchWithComputedEndTime(rows, {
      connection: conn,
      forceFinishForfeit
    });
    await conn.commit();

    // conn is committed but not yet released. assignPlacementsAfterManualMarkFinished
    // uses it only for the loadMatchesForPlacementsByIds SELECT; the actual placement
    // writes open their own pool connections and run outside this transaction.
    const placements = finishResult.applied
      ? await assignPlacementsAfterManualMarkFinished(finishResult, conn)
      : placementsFromMarkFinishedSkipped(finishResult);

    return {
      match_game_id: matchGameId,
      mark_finished: finishResult,
      placements
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
  options?: { connection?: PoolConnection; forceFinishForfeit?: boolean }
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

  const forceFinishForfeit = options?.forceFinishForfeit ?? false;

  const eligible = normalized.filter((row) => {
    if (row.status === MatchStatus.FINISHED) return false;
    if (row.status === MatchStatus.FORFEIT && !forceFinishForfeit) return false;
    return true;
  });

  if (eligible.length === 0) {
    return validationResult(
      forceFinishForfeit
        ? "All matches are already FINISHED; no update applied."
        : "All matches are already FINISHED or FORFEIT; no update applied."
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
      const updateSql = forceFinishForfeit
        ? `UPDATE Matches SET status = ?, end_timestamp = ? WHERE id = ? AND status != 'FINISHED'`
        : `UPDATE Matches SET status = ?, end_timestamp = ? WHERE id = ? AND status NOT IN ('FINISHED', 'FORFEIT')`;
      const updateResult = await runQuery<{ affectedRows: number }>(
        updateSql,
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
