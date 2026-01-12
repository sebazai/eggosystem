import { logger } from "../utils/app-logger";
import { ParsedQueueConsumer } from "./parsed-queue-consumer";
import { retryWithBackoff } from "../utils/retry-utils";

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
   * Initialize and start all queue consumers with retry logic
   */
  async startAllConsumers(): Promise<void> {
    try {
      logger.info("[QueueConsumerManager] Starting queue consumers...");

      // Initialize parsed queue consumer with retry logic
      const parsedConsumer = new ParsedQueueConsumer();

      // Retry connection with exponential backoff
      await retryWithBackoff(
        async () => {
          await parsedConsumer.connect();
          await parsedConsumer.startConsumer();
        },
        {
          maxAttempts: 5,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
          backoffMultiplier: 2,
          onRetry: (attempt, error) => {
            logger.warn(
              `[QueueConsumerManager] Connection attempt ${attempt} failed, retrying...`,
              {
                error: error.message
              }
            );
          }
        }
      );

      this.consumers.push(parsedConsumer);

      logger.info(
        "[QueueConsumerManager] All queue consumers started successfully",
        {
          consumerCount: this.consumers.length
        }
      );
    } catch (error) {
      logger.error(
        "[QueueConsumerManager] Failed to start queue consumers after all retry attempts",
        error
      );
      // Don't throw - allow server to start without RabbitMQ
      // The connection will be retried automatically via handleConnectionLoss
      logger.warn(
        "[QueueConsumerManager] Server will continue without RabbitMQ connection. Reconnection will be attempted automatically."
      );
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

  /**
   * Check if RabbitMQ consumers are healthy
   * @returns Promise resolving to object with health status and details
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    configured: boolean;
    consumerCount: number;
  }> {
    // Check if RabbitMQ is configured
    const isConfigured = !!(
      process.env.RABBITMQ_HOST &&
      process.env.RABBITMQ_USER &&
      process.env.RABBITMQ_PASSWORD
    );

    if (!isConfigured) {
      return {
        healthy: true, // Not unhealthy if not configured
        configured: false,
        consumerCount: 0
      };
    }

    if (this.consumers.length === 0) {
      return {
        healthy: false, // Configured but no consumers = unhealthy
        configured: true,
        consumerCount: 0
      };
    }

    // Check health of all consumers
    const healthChecks = await Promise.all(
      this.consumers.map((consumer) => consumer.healthCheck())
    );

    // All consumers must be healthy
    const allHealthy = healthChecks.every((isHealthy) => isHealthy);

    return {
      healthy: allHealthy,
      configured: true,
      consumerCount: this.consumers.length
    };
  }
}

// Export a singleton instance
export const queueConsumerManager = new QueueConsumerManager();
