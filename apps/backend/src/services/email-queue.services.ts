import { Queue } from "bullmq";
import { logger } from "../utils/app-logger";
import { expireIn7Days, expireIn30Days } from "../utils/redisClient";

/**
 * Job data structure for welcome email jobs
 */
export interface WelcomeEmailJobData {
  to: string;
  accountId: number;
  seasonDisplayName: string;
  seasonStartDate: string | null;
  teamName: string;
  leagueName: string;
  platform: string;
  rulebookUrl: string | null;
  discordLink: string | null;
  mapNames: string[];
  seasonId: number;
  playerEmail: string;
  playerNickname: string;
}

/**
 * Player data structure for bulk enqueueing
 */
export interface PlayerEmailData {
  email: string;
  account_id: number;
  team_name: string;
  league_name: string;
  nickname: string;
}

const EMAIL_SEND_DELAY_MS = parseInt(
  process.env.EMAIL_SEND_DELAY_MS || "500",
  10
);

// Queue configuration
const QUEUE_NAME = "welcome-emails";

// Initialize BullMQ Queue with Redis connection
export const welcomeEmailQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: process.env.REDIS_HOST ?? "eggo-redis",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000 // 1s, 2s, 4s
    },
    delay: EMAIL_SEND_DELAY_MS,
    removeOnComplete: {
      age: expireIn7Days // Remove completed jobs after 7 days
    },
    removeOnFail: {
      age: expireIn30Days // Keep failed jobs for 30 days for debugging
    }
  }
});

// Note: Rate limiting is configured in the worker, not the queue
// The queue just stores jobs, the worker controls processing rate

/**
 * Enqueue a single welcome email job
 */
export const enqueueSeasonWelcomeEmail = async (
  jobData: WelcomeEmailJobData
): Promise<void> => {
  try {
    await welcomeEmailQueue.add("send-welcome-email", jobData, {
      jobId: `welcome-${jobData.seasonId}-${jobData.accountId}-${Date.now()}`
    });

    logger.info(
      `Enqueued welcome email for ${jobData.playerNickname} (${jobData.playerEmail}) in season ${jobData.seasonId}`
    );
  } catch (error) {
    logger.error(
      `Failed to enqueue welcome email for ${jobData.playerNickname}`,
      error
    );
    throw error;
  }
};

/**
 * Enqueue multiple welcome email jobs in bulk
 */
export const enqueueBulkSeasonWelcomeEmails = async (
  seasonId: number,
  players: PlayerEmailData[],
  seasonDisplayName: string,
  seasonStartDate: string | null,
  platform: string,
  rulebookUrl: string | null,
  discordLink: string | null,
  mapNames: string[]
): Promise<{ enqueued: number; failed: number }> => {
  let enqueued = 0;
  let failed = 0;

  logger.info(
    `Starting bulk enqueue of ${players.length} welcome emails for season ${seasonId}`
  );

  // Create job data for all players
  const jobs = players.map((player) => ({
    name: "send-welcome-email",
    data: {
      to: player.email,
      accountId: player.account_id,
      seasonDisplayName,
      seasonStartDate,
      teamName: player.team_name,
      leagueName: player.league_name,
      platform,
      rulebookUrl,
      discordLink,
      mapNames,
      seasonId,
      playerEmail: player.email,
      playerNickname: player.nickname
    } satisfies WelcomeEmailJobData,
    opts: {
      jobId: `welcome-${seasonId}-${player.account_id}-${Date.now()}`
    }
  }));

  try {
    // Use BullMQ's bulk add for efficiency
    await welcomeEmailQueue.addBulk(jobs);
    enqueued = jobs.length;

    logger.info(
      `Successfully enqueued ${enqueued} welcome email jobs for season ${seasonId}`
    );
  } catch (error) {
    logger.error(
      `Failed to bulk enqueue welcome emails for season ${seasonId}`,
      error
    );
    failed = jobs.length;
    throw error;
  }

  return { enqueued, failed };
};

/**
 * Get queue statistics for monitoring
 */
export const getEmailQueueStats = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      welcomeEmailQueue.getWaitingCount(),
      welcomeEmailQueue.getActiveCount(),
      welcomeEmailQueue.getCompletedCount(),
      welcomeEmailQueue.getFailedCount(),
      welcomeEmailQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  } catch (error) {
    logger.error("Failed to get email queue stats", error);
    throw error;
  }
};

/**
 * Close the queue connection gracefully
 */
export const closeEmailQueue = async (): Promise<void> => {
  try {
    await welcomeEmailQueue.close();
    logger.info("Email queue closed successfully");
  } catch (error) {
    logger.error("Error closing email queue", error);
    throw error;
  }
};
