import { Queue } from "bullmq";
import { logger } from "../utils/app-logger";
import { expireIn7Days, expireIn30Days } from "../utils/redisClient";

export interface NewsletterEmailJobData {
  to: string;
  accountId: number;
  subject: string;
  textContent?: string;
  htmlContent?: string;
  seasonId: number;
  playerNickname: string;
}

const EMAIL_SEND_DELAY_MS = parseInt(
  process.env.EMAIL_SEND_DELAY_MS || "500",
  10
);

const QUEUE_NAME = "newsletter-emails";

let _newsletterEmailQueue: Queue | null = null;

const getNewsletterEmailQueue = (): Queue => {
  if (!_newsletterEmailQueue) {
    _newsletterEmailQueue = new Queue(QUEUE_NAME, {
      connection: {
        host: process.env.REDIS_HOST ?? "eggo-redis",
        port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000
        },
        delay: EMAIL_SEND_DELAY_MS,
        removeOnComplete: {
          age: expireIn7Days
        },
        removeOnFail: {
          age: expireIn30Days
        }
      }
    });
  }
  return _newsletterEmailQueue;
};

export const enqueueBulkNewsletterEmails = async (
  jobs: NewsletterEmailJobData[],
  queue?: Queue
): Promise<{ enqueued: number }> => {
  const emailQueue = queue ?? getNewsletterEmailQueue();

  const bulkJobs = jobs.map((data) => ({
    name: "send-newsletter-email",
    data,
    opts: {
      jobId: `newsletter-${data.seasonId}-${data.accountId}-${Date.now()}`
    }
  }));

  try {
    await emailQueue.addBulk(bulkJobs);
    logger.info(`Successfully enqueued ${jobs.length} newsletter email jobs`);
    return { enqueued: jobs.length };
  } catch (error) {
    logger.error("Failed to bulk enqueue newsletter emails", error);
    throw error;
  }
};
