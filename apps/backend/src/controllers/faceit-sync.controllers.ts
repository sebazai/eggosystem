import { type Request, type Response, type NextFunction } from "express";
import { triggerManualFaceitSync } from "../services/cron-scheduler.services";
import { logger } from "../utils/app-logger";

/**
 * Controller to manually trigger FACEIT match synchronization
 * This endpoint can be used for testing or manual operations
 */
export const triggerFaceitMatchSync = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info("Manual FACEIT match sync triggered via API endpoint");

    // Start the sync process asynchronously
    triggerManualFaceitSync()
      .then(() => {
        logger.info("Manual FACEIT match sync completed successfully");
      })
      .catch((error) => {
        logger.error("Manual FACEIT match sync failed:", error);
      });

    // Return immediate response to avoid timeout
    res.status(200).json({
      message: "FACEIT match sync initiated successfully",
      note: "The sync process is running in the background. Check server logs for progress and results."
    });
  } catch (error) {
    logger.error("Error initiating manual FACEIT sync:", error);
    return next(error);
  }
};
