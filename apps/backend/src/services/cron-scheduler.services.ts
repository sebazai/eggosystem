import * as cron from "node-cron";
import { syncAllFaceitChampionshipMatches } from "./faceit-match-sync.services";
import { logger } from "../utils/app-logger";

/**
 * Starts the FACEIT match sync cron job
 * Runs every 6 hours at minutes 0 (00:00, 06:00, 12:00, 18:00)
 */
export const startFaceitMatchSyncCron = (): void => {
  logger.info("Initializing FACEIT match sync cron job...");

  // Schedule to run every 6 hours
  // Cron expression: "0 */6 * * *" means at minute 0 of every 6th hour
  cron.schedule(
    "0 */6 * * *",
    async () => {
      const startTime = new Date();
      logger.info(
        `[${startTime.toISOString()}] Starting scheduled FACEIT match sync...`
      );

      try {
        await syncAllFaceitChampionshipMatches();
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        logger.info(
          `[${endTime.toISOString()}] FACEIT match sync completed successfully. Duration: ${duration}ms`
        );
      } catch (error) {
        const endTime = new Date();
        logger.error(
          `[${endTime.toISOString()}] FACEIT match sync failed:`,
          error
        );
      }
    },
    {
      timezone: "Europe/Helsinki" // Set to Finnish timezone for consistency
    }
  );

  logger.info(
    "FACEIT match sync cron job started. Will run every 6 hours at 00:00, 06:00, 12:00, 18:00 (Helsinki time)"
  );

  // Optional: Run once immediately on startup (for testing/immediate sync)
  if (process.env.NODE_ENV === "development") {
    logger.info("Development mode: Running initial FACEIT match sync...");
    void setTimeout(async () => {
      try {
        await syncAllFaceitChampionshipMatches();
        logger.info("Initial FACEIT match sync completed");
      } catch (error) {
        logger.error("Initial FACEIT match sync failed:", error);
      }
    }, 5000); // Wait 5 seconds after startup
  }
};

/**
 * Manually trigger FACEIT match sync (useful for testing or manual operations)
 */
export const triggerManualFaceitSync = async (): Promise<void> => {
  logger.info("Manual FACEIT match sync triggered...");
  try {
    await syncAllFaceitChampionshipMatches();
    logger.info("Manual FACEIT match sync completed successfully");
  } catch (error) {
    logger.error("Manual FACEIT match sync failed:", error);
    throw error;
  }
};
