import { app } from "./src/app";
import { logger } from "./src/utils/app-logger";
import { queueConsumerManager } from "./src/services/queue-consumer-manager";
import { startFaceitMatchSyncCron } from "./src/services/cron-scheduler.services";
import { redisClient } from "./src/utils/redisClient";

const port = process.env.PORT || 3001;

if (process.env.NODE_ENV === "e2e") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mswServer } = require("@eggosystem/shared-msw");
  logger.info("Starting MSW for E2E tests...");
  mswServer.listen({ onUnhandledRequest: "bypass" });

  // Clear Redis cache for e2e tests
  try {
    void redisClient.flushall();
    logger.info("Redis cache cleared for E2E tests");
  } catch (error) {
    logger.warn("Failed to clear Redis cache:", error);
  }
}

const server = app.listen(port, () => {
  logger.info(`Server started at ${process.env.BACKEND_URL}`);
});

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
  await queueConsumerManager.stopAllConsumers();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await queueConsumerManager.stopAllConsumers();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
