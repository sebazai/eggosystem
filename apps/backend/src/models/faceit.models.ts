import { type FaceitLink, type FaceitValidationError } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

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
