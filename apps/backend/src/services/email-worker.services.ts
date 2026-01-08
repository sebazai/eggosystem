import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { logger } from "../utils/app-logger";
import { redisClient } from "../utils/redisClient";
import type { WelcomeEmailJobData } from "./email-queue.services";
import { sendSeasonWelcomeEmail } from "./email-sender.services";

const QUEUE_NAME = "welcome-emails";
let emailWorker: Worker | null = null;

/**
 * Process a welcome email job
 */
const processWelcomeEmailJob = async (
  job: Job<WelcomeEmailJobData>
): Promise<void> => {
  const {
    to,
    accountId,
    seasonDisplayName,
    seasonStartDate,
    teamName,
    leagueName,
    platform,
    rulebookUrl,
    discordLink,
    mapNames,
    seasonId,
    playerEmail,
    playerNickname
  } = job.data;

  logger.info(
    `Processing welcome email job ${job.id} for ${playerNickname} (${playerEmail}) in season ${seasonId}`
  );

  try {
    // Send the email
    await sendSeasonWelcomeEmail(
      to,
      accountId,
      seasonDisplayName,
      seasonStartDate,
      teamName,
      leagueName,
      platform,
      rulebookUrl,
      discordLink,
      mapNames
    );

    // Track success in Redis
    await incrementEmailStats(seasonId, "successful");

    logger.info(
      `Successfully sent welcome email to ${playerNickname} (${playerEmail}) for season ${seasonId}`
    );
  } catch (error) {
    // Track failure in Redis
    await incrementEmailStats(seasonId, "failed");

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to send welcome email to ${playerNickname} (${playerEmail}) for season ${seasonId}`,
      error
    );

    // Re-throw to let BullMQ handle retry logic
    throw new Error(
      `Failed to send welcome email to ${playerEmail}: ${errorMessage}`
    );
  }
};

/**
 * Increment email statistics in Redis
 */
const incrementEmailStats = async (
  seasonId: number,
  type: "successful" | "failed"
): Promise<void> => {
  try {
    const key = `email-stats:season:${seasonId}`;
    await redisClient.hincrby(key, type, 1);
    // Set expiry to 90 days for stats
    await redisClient.expire(key, 90 * 24 * 60 * 60);
  } catch (error) {
    logger.error(
      `Failed to increment email stats for season ${seasonId}`,
      error
    );
    // Don't throw - stats tracking shouldn't fail the job
  }
};

/**
 * Get email statistics for a season
 */
export const getEmailStatsForSeason = async (
  seasonId: number
): Promise<{ successful: number; failed: number }> => {
  try {
    const key = `email-stats:season:${seasonId}`;
    const stats = await redisClient.hgetall(key);

    return {
      successful: parseInt(stats.successful || "0", 10),
      failed: parseInt(stats.failed || "0", 10)
    };
  } catch (error) {
    logger.error(`Failed to get email stats for season ${seasonId}`, error);
    return { successful: 0, failed: 0 };
  }
};

/**
 * Start the email worker
 */
export const startEmailWorker = (): void => {
  if (emailWorker) {
    logger.warn("Email worker is already running");
    return;
  }

  logger.info("Starting email worker...");

  emailWorker = new Worker(QUEUE_NAME, processWelcomeEmailJob, {
    connection: {
      host: process.env.REDIS_HOST ?? "eggo-redis",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
    },
    concurrency: 1, // Process one job at a time to respect rate limiting
    limiter: {
      max: 1,
      duration: parseInt(process.env.EMAIL_SEND_DELAY_MS || "750", 10)
    }
  });

  // Worker event handlers
  emailWorker.on("completed", (job: Job) => {
    logger.info(`Email job ${job.id} completed successfully`);
  });

  emailWorker.on("failed", (job: Job | undefined, error: Error) => {
    if (job) {
      logger.error(
        `Email job ${job.id} failed after ${job.attemptsMade} attempts`,
        error
      );
    } else {
      logger.error("Email job failed (job undefined)", error);
    }
  });

  emailWorker.on("error", (error: Error) => {
    logger.error("Email worker error", error);
  });

  emailWorker.on("stalled", (jobId: string) => {
    logger.warn(`Email job ${jobId} stalled`);
  });

  logger.info("Email worker started successfully");
};

/**
 * Stop the email worker gracefully
 */
export const stopEmailWorker = async (): Promise<void> => {
  if (!emailWorker) {
    logger.warn("Email worker is not running");
    return;
  }

  logger.info("Stopping email worker...");

  try {
    await emailWorker.close();
    emailWorker = null;
    logger.info("Email worker stopped successfully");
  } catch (error) {
    logger.error("Error stopping email worker", error);
    throw error;
  }
};

/**
 * Check if worker is running
 */
export const isEmailWorkerRunning = (): boolean => {
  return emailWorker !== null;
};
