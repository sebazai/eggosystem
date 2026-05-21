import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { logger } from "../utils/app-logger";
import { redisClient } from "../utils/redisClient";
import type { NewsletterEmailJobData } from "./newsletter-queue.services";
import { sendNewsletterEmail } from "./email-sender.services";

const QUEUE_NAME = "newsletter-emails";
let newsletterWorker: Worker | null = null;

const processNewsletterEmailJob = async (
  job: Job<NewsletterEmailJobData>
): Promise<void> => {
  const {
    to,
    accountId,
    subject,
    textContent,
    htmlContent,
    seasonId,
    playerNickname
  } = job.data;

  logger.info(
    `Processing newsletter email job ${job.id} for ${playerNickname} (${to}) in season ${seasonId}`
  );

  try {
    await sendNewsletterEmail(to, accountId, subject, textContent, htmlContent);

    const key = `email-stats:newsletter:${seasonId}`;
    await redisClient.hincrby(key, "successful", 1);
    await redisClient.expire(key, 90 * 24 * 60 * 60);

    logger.info(
      `Successfully sent newsletter email to ${playerNickname} (${to}) for season ${seasonId}`
    );
  } catch (error) {
    const key = `email-stats:newsletter:${seasonId}`;
    await redisClient.hincrby(key, "failed", 1).catch(() => {});

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to send newsletter email to ${playerNickname} (${to}) for season ${seasonId}`,
      error
    );
    throw new Error(
      `Failed to send newsletter email to ${to}: ${errorMessage}`,
      {
        cause: error
      }
    );
  }
};

export const startNewsletterWorker = (): void => {
  if (newsletterWorker) {
    logger.warn("Newsletter worker is already running");
    return;
  }

  logger.info("Starting newsletter worker...");

  newsletterWorker = new Worker(QUEUE_NAME, processNewsletterEmailJob, {
    connection: {
      host: process.env.REDIS_HOST ?? "eggo-redis",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
    },
    concurrency: 1,
    limiter: {
      max: 1,
      duration: parseInt(process.env.EMAIL_SEND_DELAY_MS || "750", 10)
    }
  });

  newsletterWorker.on("completed", (job: Job) => {
    logger.info(`Newsletter email job ${job.id} completed successfully`);
  });

  newsletterWorker.on("failed", (job: Job | undefined, error: Error) => {
    if (job) {
      logger.error(
        `Newsletter email job ${job.id} failed after ${job.attemptsMade} attempts`,
        error
      );
    } else {
      logger.error("Newsletter email job failed (job undefined)", error);
    }
  });

  newsletterWorker.on("error", (error: Error) => {
    logger.error("Newsletter worker error", error);
  });

  newsletterWorker.on("stalled", (jobId: string) => {
    logger.warn(`Newsletter email job ${jobId} stalled`);
  });

  logger.info("Newsletter worker started successfully");
};

export const stopNewsletterWorker = async (): Promise<void> => {
  if (!newsletterWorker) {
    logger.warn("Newsletter worker is not running");
    return;
  }

  logger.info("Stopping newsletter worker...");

  try {
    await newsletterWorker.close();
    newsletterWorker = null;
    logger.info("Newsletter worker stopped successfully");
  } catch (error) {
    logger.error("Error stopping newsletter worker", error);
    throw error;
  }
};
