import { type FaceitLink, type FaceitValidationError } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const updateErrorForWebhook = async (
  externalPayloadId: string,
  errorType: FaceitValidationError,
  errorDetails: unknown
) => {
  return runQuery<{ insertId: number }>(
    "UPDATE FaceitWebhooks SET error_type = ?, error_details = ? WHERE external_payload_id = ?",
    [errorType, JSON.stringify(errorDetails), externalPayloadId]
  );
};

export const saveWebhookData = async (
  externalPayloadId: string,
  retryCount: number,
  event: string,
  data: object | unknown,
  details: object | unknown | null,
  manualProcessed: boolean = false,
  errorType: FaceitValidationError | null = null,
  errorDetails: unknown | null = null
) => {
  return runQuery<{ insertId: number }>(
    "INSERT INTO FaceitWebhooks (external_payload_id, retry_count, manual_reprocess, event, data, details, error_type, error_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      externalPayloadId,
      retryCount,
      manualProcessed,
      event,
      JSON.stringify(data),
      details ? JSON.stringify(details) : null,
      errorType,
      errorDetails ? JSON.stringify(errorDetails) : null
    ]
  );
};

/**
 * Count of match_status_finished after the last match_status_configuring for this room.
 * Resets the effective game index after a restart (configuring sets matches to ONGOING).
 * Excludes retries and manual reprocess.
 */
export const getMatchStatusFinishedCountAfterLastConfiguring = async (
  externalPayloadId: string
): Promise<number> => {
  const result = await runQuery<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM FaceitWebhooks fw
     WHERE fw.external_payload_id = ? AND fw.event = 'match_status_finished'
     AND fw.retry_count = 0 AND COALESCE(fw.manual_reprocess, 0) = 0
     AND fw.received_at > COALESCE(
       (SELECT MAX(received_at) FROM FaceitWebhooks
        WHERE external_payload_id = ? AND event = 'match_status_configuring'),
       '1970-01-01 00:00:00'
     )`,
    [externalPayloadId, externalPayloadId]
  );
  return result[0]?.count ?? 0;
};

export const getFaceitLinksForSeason = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<FaceitLink[]> => {
  const query = `
    SELECT 
      slei.id,
      slei.season_id,
      slei.league_id,
      l.name AS league_name,
      slei.external_id,
      slei.external_league_name,
      slei.type,
      l.sort_priority,
      CONCAT('https://www.faceit.com/en/championship/', slei.external_id) AS faceit_url
    FROM SeasonLeagueExternalIds slei
    JOIN Leagues l ON l.id = slei.league_id
    WHERE slei.season_id = ?
    ORDER BY l.sort_priority ASC, l.name ASC
  `;

  const results = await runQuery<FaceitLink[]>(query, [seasonId], connection);
  return results;
};
