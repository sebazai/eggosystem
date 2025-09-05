import * as cron from "node-cron";
import { syncAllFaceitChampionshipMatches } from "./faceit.services";
import { logger } from "../utils/app-logger";
import { runQuery } from "../db/mysqlRunQuery";
import { getFaceitMatchesForFaceitLeague } from "./standings.services";
import { type SeasonLeagueExternalId } from "@eggosystem/types";

const syncMatchesManualGroup = async (type: string): Promise<void> => {
  const seasonLeagueExternalIds = await runQuery<SeasonLeagueExternalId[]>(
    "SELECT * FROM SeasonLeagueExternalIds"
  );
  for (const seasonLeagueExternalId of seasonLeagueExternalIds) {
    if (!seasonLeagueExternalId.manual_group) {
      continue;
    }

    // Fetch all matches using pagination
    const allMatches = [];
    let offset = 0;
    const limit = 100;
    let hasMoreMatches = true;

    while (hasMoreMatches) {
      const matches = await getFaceitMatchesForFaceitLeague(
        seasonLeagueExternalId.external_id,
        type,
        limit,
        offset
      );

      if (matches.length === 0) {
        hasMoreMatches = false;
        break;
      }

      allMatches.push(...matches);

      // If we got fewer matches than the limit, we've reached the end
      if (matches.length < limit) {
        hasMoreMatches = false;
        break;
      }

      offset += limit;
    }

    for (const match of allMatches) {
      await runQuery(
        "UPDATE Matches SET group = ? WHERE external_match_room_id = ?",
        [seasonLeagueExternalId.manual_group, match.match_id]
      );
    }
  }
};

/**
 * Starts the FACEIT match sync cron job
 * Runs every 6 hours at minutes 0 (00:00, 06:00, 12:00, 18:00)
 */
export const startFaceitMatchSyncCron = (): void => {
  // Schedule to run every 3 hours
  // Cron expression: "0 */3 * * *" means at minute 0 of every 3th hour
  cron.schedule(
    "0 */3 * * *",
    async () => {
      const startTime = new Date();
      logger.info(
        `[${startTime.toISOString()}] Starting scheduled FACEIT match sync...`
      );

      try {
        await syncAllFaceitChampionshipMatches();
        await syncMatchesManualGroup("past");
        await syncMatchesManualGroup("upcoming");
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        logger.info(
          `[FACEIT CRON] FACEIT match sync completed successfully. Duration: ${duration}ms`
        );
      } catch (error) {
        logger.error(`[FACEIT CRON] FACEIT match sync failed:`, error);
      }
    },
    {
      timezone: "Europe/Helsinki" // Set to Finnish timezone for consistency
    }
  );

  logger.info(
    "FACEIT match sync cron job started. Will run every 3 hours (Helsinki time)"
  );
};

export const triggerManualFaceitSync = async (): Promise<void> => {
  logger.info("Manual FACEIT match sync triggered...");
  await syncAllFaceitChampionshipMatches();
};
