import { app } from "./src/app";
import { logger } from "./src/utils/app-logger";
import { queueConsumerManager } from "./src/services/queue-consumer-manager";

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  logger.info(`Server started at ${process.env.BACKEND_URL}`);
});

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
