import { runQuery } from "../db/mysqlRunQuery";
import { getMatchDateTime, adjustMatchDateTime } from "../utils/date-utils";
import { logger } from "../utils/app-logger";

interface FaceitMatch {
  match_id: string;
  scheduled_at: number;
  started_at?: number;
  status: string;
  best_of: number;
  teams: {
    [key: string]: {
      name: string;
    };
  };
}

interface FaceitMatchesResponse {
  items: FaceitMatch[];
  start: number;
  end: number;
}

interface DatabaseMatch {
  id: number;
  external_match_room_id: string;
  match_date: string;
  start_time: string;
  status: string;
}

/**
 * Fetches matches from FACEIT API for a specific championship
 */
export const fetchFaceitChampionshipMatches = async (
  championshipId: string
): Promise<FaceitMatch[]> => {
  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  try {
    const response = await fetch(
      `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `FACEIT API error for championship ${championshipId}: ${response.status} ${response.statusText}`
      );
    }

    const data: FaceitMatchesResponse = await response.json();
    return data.items || [];
  } catch (error) {
    logger.error(
      `Error fetching FACEIT matches for championship ${championshipId}:`,
      error
    );
    throw error;
  }
};

/**
 * Gets championship IDs from active seasons
 */
export const getActiveSeasonChampionshipIds = async (): Promise<
  { external_id: string; isBO2PlayedAs2xBO1: boolean }[]
> => {
  const query = `
    SELECT slei.external_id, slei.isBO2PlayedAs2xBO1
    FROM SeasonLeagueExternalIds slei
    JOIN Seasons s ON slei.season_id = s.id
    WHERE slei.type = 'championship' 
      AND s.start_date <= NOW() 
      AND (s.end_date IS NULL OR s.end_date >= NOW())
  `;

  const results =
    await runQuery<Array<{ external_id: string; isBO2PlayedAs2xBO1: boolean }>>(
      query
    );

  return results;
};

/**
 * Gets database matches for a specific external match room ID
 */
export const getDatabaseMatchesByExternalId = async (
  externalMatchRoomId: string
): Promise<DatabaseMatch[]> => {
  const query = `
    SELECT id, external_match_room_id, match_date, start_time, status
    FROM Matches 
    WHERE external_match_room_id = ?
    ORDER BY start_time ASC
  `;

  const matches = await runQuery<DatabaseMatch[]>(query, [externalMatchRoomId]);
  return matches;
};

/**
 * Updates match date and start time for matches with the given external match room ID
 */
export const updateMatchDateAndTime = async (
  externalMatchRoomId: string,
  matchDate: string,
  startTime: string
): Promise<void> => {
  const matches = await runQuery<Array<{ id: number }>>(
    "SELECT id FROM Matches WHERE external_match_room_id = ?",
    [externalMatchRoomId]
  );

  if (matches.length === 0) {
    logger.warn(
      `No matches found with external_match_room_id: ${externalMatchRoomId}`
    );
    return;
  }

  await runQuery(
    "UPDATE Matches SET match_date = ?, start_time = ? WHERE external_match_room_id = ?",
    [matchDate, startTime, externalMatchRoomId]
  );

  logger.info(
    `Updated match_date to ${matchDate} and start_time to ${startTime} for ${matches.length} match(es) with external_match_room_id: ${externalMatchRoomId}`
  );
};

/**
 * Compares FACEIT match schedule with database matches and updates if necessary
 */
export const syncMatchSchedule = async (
  faceitMatch: FaceitMatch,
  isBO2PlayedAs2xBO1: boolean
): Promise<void> => {
  const databaseMatches = await getDatabaseMatchesByExternalId(
    faceitMatch.match_id
  );

  if (databaseMatches.length === 0) {
    logger.warn(
      `No database matches found for external_match_room_id: ${faceitMatch.match_id}`
    );
    return;
  }

  // Convert FACEIT scheduled_at (Unix timestamp) to match_date and start_time
  const faceitSchedule = getMatchDateTime(faceitMatch.scheduled_at);

  // Get the first match to compare schedules
  const firstMatch = databaseMatches[0];
  const currentSchedule = {
    match_date: firstMatch.match_date,
    start_time: firstMatch.start_time
  };

  // Check if the schedule has changed
  const scheduleChanged =
    faceitSchedule.match_date !== currentSchedule.match_date ||
    faceitSchedule.start_time !== currentSchedule.start_time;

  if (!scheduleChanged) {
    logger.info(
      `No schedule change for match ${faceitMatch.match_id}: ${faceitSchedule.match_date} ${faceitSchedule.start_time}`
    );
    return;
  }

  logger.info(`Schedule change detected for match ${faceitMatch.match_id}:`);
  logger.info(
    `  Current: ${currentSchedule.match_date} ${currentSchedule.start_time}`
  );
  logger.info(
    `  FACEIT:  ${faceitSchedule.match_date} ${faceitSchedule.start_time}`
  );

  try {
    if (isBO2PlayedAs2xBO1 && databaseMatches.length === 2) {
      // Handle BO2 matches stored as 2 BO1 matches
      // First match gets the FACEIT schedule
      await updateMatchDateAndTime(
        firstMatch.external_match_room_id!,
        faceitSchedule.match_date,
        faceitSchedule.start_time
      );

      // Second match gets +1 hour from the first match
      const secondMatchSchedule = adjustMatchDateTime(
        faceitSchedule.match_date,
        faceitSchedule.start_time,
        { hours: 1 }
      );

      // Update the second match directly by ID since they share external_match_room_id
      const updateSecondMatchQuery = `
        UPDATE Matches 
        SET match_date = ?, start_time = ? 
        WHERE id = ?
      `;

      await runQuery(updateSecondMatchQuery, [
        secondMatchSchedule.match_date,
        secondMatchSchedule.start_time,
        databaseMatches[1].id
      ]);

      logger.info(
        `Updated BO2 match schedules: First match at ${faceitSchedule.match_date} ${faceitSchedule.start_time}, Second match at ${secondMatchSchedule.match_date} ${secondMatchSchedule.start_time}`
      );
    } else {
      // Handle regular matches or single BO1
      await updateMatchDateAndTime(
        faceitMatch.match_id,
        faceitSchedule.match_date,
        faceitSchedule.start_time
      );

      logger.info(
        `Updated single match schedule: ${faceitSchedule.match_date} ${faceitSchedule.start_time}`
      );
    }
  } catch (error) {
    logger.error(
      `Error updating match schedule for ${faceitMatch.match_id}:`,
      error
    );
    throw error;
  }
};

/**
 * Main function to sync all FACEIT championship matches
 */
export const syncAllFaceitChampionshipMatches = async (): Promise<void> => {
  logger.info("Starting FACEIT championship match sync...");

  try {
    // Get all active season championship IDs
    const championshipIds = await getActiveSeasonChampionshipIds();
    logger.info(
      `Found ${championshipIds.length} active season championships to sync`
    );

    if (championshipIds.length === 0) {
      logger.info("No active season championships found. Sync completed.");
      return;
    }

    let totalMatchesSynced = 0;

    for (const championship of championshipIds) {
      try {
        logger.info(`Syncing championship: ${championship.external_id}`);

        // Fetch matches from FACEIT API
        const faceitMatches = await fetchFaceitChampionshipMatches(
          championship.external_id
        );
        logger.info(
          `Found ${faceitMatches.length} matches in FACEIT for championship ${championship.external_id}`
        );

        // Sync each match
        for (const faceitMatch of faceitMatches) {
          try {
            await syncMatchSchedule(
              faceitMatch,
              championship.isBO2PlayedAs2xBO1
            );

            totalMatchesSynced++;
          } catch (error) {
            logger.error(`Error syncing match ${faceitMatch.match_id}:`, error);
            // Continue with other matches
          }
        }

        // Small delay between championships to be respectful to FACEIT API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(
          `Error syncing championship ${championship.external_id}:`,
          error
        );
        // Continue with other championships
      }
    }

    logger.info(
      `FACEIT championship match sync completed. Processed ${totalMatchesSynced} matches across ${championshipIds.length} championships.`
    );
  } catch (error) {
    logger.error("Error in syncAllFaceitChampionshipMatches:", error);
    throw error;
  }
};
