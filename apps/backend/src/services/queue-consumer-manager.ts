import { logger } from "../utils/app-logger";
import { ParsedQueueConsumer } from "./parsed-queue-consumer";

/**
 * Queue Consumer Manager
 * Manages all queue consumers in the application
 */
export class QueueConsumerManager {
  private consumers: ParsedQueueConsumer[] = [];
  private isShuttingDown = false;

  constructor() {
    // Handle graceful shutdown
    process.on("SIGTERM", () => this.gracefulShutdown());
    process.on("SIGINT", () => this.gracefulShutdown());
  }

  /**
   * Initialize and start all queue consumers
   */
  async startAllConsumers(): Promise<void> {
    try {
      logger.info("[QueueConsumerManager] Starting queue consumers...");

      // Initialize parsed queue consumer
      const parsedConsumer = new ParsedQueueConsumer();
      await parsedConsumer.connect();
      await parsedConsumer.startConsumer();
      this.consumers.push(parsedConsumer);

      logger.info(
        "[QueueConsumerManager] All queue consumers started successfully",
        {
          consumerCount: this.consumers.length
        }
      );
    } catch (error) {
      logger.error("Failed to start queue consumers", error);
      throw error;
    }
  }

  /**
   * Stop all queue consumers gracefully
   */
  async stopAllConsumers(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info("[QueueConsumerManager] Stopping all queue consumers...");

    const stopPromises = this.consumers.map(async (consumer) => {
      try {
        await consumer.stopConsumer();
        logger.info(
          "[QueueConsumerManager] Queue consumer stopped successfully"
        );
      } catch (error) {
        logger.error(
          "[QueueConsumerManager] Error stopping queue consumer",
          error
        );
      }
    });

    await Promise.all(stopPromises);
    this.consumers = [];

    logger.info("[QueueConsumerManager] All queue consumers stopped");
  }

  /**
   * Graceful shutdown handler
   */
  private async gracefulShutdown(): Promise<void> {
    logger.info(
      "[QueueConsumerManager] Received shutdown signal, stopping queue consumers..."
    );
    await this.stopAllConsumers();
    process.exit(0);
  }

  /**
   * Get the status of all consumers
   */
  getConsumerStatus(): { consumerCount: number; isShuttingDown: boolean } {
    return {
      consumerCount: this.consumers.length,
      isShuttingDown: this.isShuttingDown
    };
  }
}

// Export a singleton instance
export const queueConsumerManager = new QueueConsumerManager();
