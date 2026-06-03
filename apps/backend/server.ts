import { app } from "./src/app";
import { logger } from "./src/utils/app-logger";
import { queueConsumerManager } from "./src/services/queue-consumer-manager";
import { startFaceitMatchSyncCron } from "./src/services/cron-scheduler.services";
import {
  startEmailWorker,
  stopEmailWorker
} from "./src/services/email-worker.services";
import {
  startNewsletterWorker,
  stopNewsletterWorker
} from "./src/services/newsletter-worker.services";
import {
  startFailedParseBackgroundWorker,
  stopFailedParseBackgroundWorker
} from "./src/services/failed-parse-background-worker.services";
import { closeFailedParseBackgroundQueue } from "./src/services/failed-parse-background-queue.services";

const port = process.env.PORT || 3001;

if (process.env.NODE_ENV === "e2e") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mswServer } = require("@eggosystem/shared-msw");
  logger.info("Starting MSW for E2E tests...");
  mswServer.listen({ onUnhandledRequest: "bypass" });

  if (!process.env.CI) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { redisClient } = require("./dist/src/utils/redisClient");
      void redisClient.flushall();
      logger.info("Redis cache cleared for E2E tests");
    } catch (error) {
      logger.warn("Failed to clear Redis cache:", error);
    }
  }
}

const server = app.listen(port, () => {
  logger.info(`Server started at ${process.env.BACKEND_URL}`);
});

// Start email worker for processing queued welcome emails
if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "e2e") {
  try {
    startEmailWorker();
  } catch (error) {
    logger.error("Failed to start email worker:", error);
  }
  try {
    startFailedParseBackgroundWorker();
  } catch (error) {
    logger.error("Failed to start failed-parse background worker:", error);
  }
  try {
    startNewsletterWorker();
  } catch (error) {
    logger.error("Failed to start newsletter worker:", error);
  }
}

// Initialize FACEIT match sync cron job if FACEIT API key is available and not in test mode
if (
  process.env.FACEIT_API_KEY &&
  process.env.NODE_ENV !== "test" &&
  process.env.NODE_ENV !== "e2e"
) {
  try {
    startFaceitMatchSyncCron();
  } catch (error) {
    logger.error("Failed to initialize FACEIT match sync cron job:", error);
  }
}

// Handle server shutdown gracefully
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await stopEmailWorker();
  await stopNewsletterWorker();
  await stopFailedParseBackgroundWorker();
  await closeFailedParseBackgroundQueue();
  await queueConsumerManager.stopAllConsumers();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await stopEmailWorker();
  await stopNewsletterWorker();
  await stopFailedParseBackgroundWorker();
  await closeFailedParseBackgroundQueue();
  await queueConsumerManager.stopAllConsumers();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
