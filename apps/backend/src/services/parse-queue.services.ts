import amqp from "amqplib";
import { logger } from "../utils/app-logger";

// RabbitMQ connection configuration
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "eggo-rabbitmq";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "test";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "test";
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || "/";

// Queue names
const PARSE_QUEUE = "parse_queue";

// Connection URI
const getConnectionUri = () => {
  return `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}/${RABBITMQ_VHOST}`;
};

import type { ParseQueueMessage } from "../types/parse-queue.types";

/**
 * Connect to RabbitMQ and create a channel
 * @returns A Promise resolving to the RabbitMQ channel
 */
const createChannel = async () => {
  try {
    const connection = await amqp.connect(getConnectionUri());
    const channel = await connection.createChannel();

    // Check if queue exists first to handle existing queues gracefully
    try {
      await channel.checkQueue(PARSE_QUEUE);
      logger.info("Parse queue already exists, using existing configuration");
    } catch (_error) {
      // Queue doesn't exist, create it with our preferred settings
      await channel.assertQueue(PARSE_QUEUE, {
        durable: true,
        arguments: {
          "x-message-ttl": 3600000, // 1 hour TTL
          "x-dead-letter-exchange": "dlx", // Dead letter exchange
          "x-dead-letter-routing-key": "failed"
        }
      });
      logger.info("Created parse queue with durable settings");
    }

    return { connection, channel };
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", error);
    throw error;
  }
};

/**
 * Publish a demo processing request to the parse_queue
 * @param request The demo processing request to publish
 * @returns A Promise resolving when the message is published
 */
export const publishToParseQueue = async (
  request: ParseQueueMessage
): Promise<void> => {
  let connection;
  let channel;

  try {
    // Create connection and channel
    const resources = await createChannel();
    connection = resources.connection;
    channel = resources.channel;

    // Publish message to queue
    const message = Buffer.from(JSON.stringify(request));
    const published = channel.sendToQueue(PARSE_QUEUE, message, {
      persistent: true,
      contentType: "application/json",
      priority: request.priority,
      messageId: `parse-${request.game_id}-${Date.now()}`,
      timestamp: Date.now()
    });

    if (!published) {
      throw new Error("Failed to publish message to parse_queue");
    }

    logger.info(
      `Published demo processing request to parse_queue for game_id: ${request.game_id}`
    );

    return;
  } catch (error) {
    logger.error("Error publishing demo processing request to parse_queue", {
      gameId: request.game_id,
      downloadUrl: request.download_url,
      error
    });
    throw error;
  } finally {
    // Close channel and connection
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
};

/**
 * Publish multiple demo processing requests to the parse_queue
 * @param requests Array of demo processing requests
 * @returns A Promise resolving to the number of messages published
 */
export const bulkPublishToParseQueue = async (
  requests: ParseQueueMessage[]
): Promise<number> => {
  let connection;
  let channel;
  let publishedCount = 0;

  try {
    // Create connection and channel
    const resources = await createChannel();
    connection = resources.connection;
    channel = resources.channel;

    // Publish each request
    for (const request of requests) {
      try {
        const message = Buffer.from(JSON.stringify(request));
        const published = channel.sendToQueue(PARSE_QUEUE, message, {
          persistent: true,
          contentType: "application/json",
          priority: request.priority,
          messageId: `parse-${request.game_id}-${Date.now()}`,
          timestamp: Date.now()
        });

        if (published) {
          publishedCount++;
          logger.debug(
            `Published demo processing request to parse_queue for game_id: ${request.game_id}`
          );
        } else {
          logger.error(
            `Failed to publish demo processing request for game_id: ${request.game_id}`
          );
        }
      } catch (error) {
        logger.error(`Error publishing individual demo processing request`, {
          gameId: request.game_id,
          downloadUrl: request.download_url,
          error
        });
        // Continue with other requests even if one fails
      }
    }

    logger.info(
      `Published ${publishedCount}/${requests.length} demo processing requests to parse_queue`
    );

    return publishedCount;
  } catch (error) {
    logger.error("Error in bulk publishing to parse_queue", error);
    throw error;
  } finally {
    // Close channel and connection
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
};

/**
 * Create a demo processing request object
 * @param gameId The game ID
 * @param downloadUrl The demo download URL
 * @param priority The priority level (1-10, default 5)
 * @param source The source of the request
 * @returns A ParseQueueMessage object
 */
export const createDemoProcessingRequest = (
  gameId: number,
  downloadUrl: string,
  priority: number = 5,
  source: string = "game-processor"
): ParseQueueMessage => {
  return {
    game_id: gameId.toString(),
    download_url: downloadUrl,
    priority,
    created_at: new Date().toISOString(),
    source
  };
};

/**
 * Validate a demo processing request
 * @param request The request to validate
 * @returns True if valid, false otherwise
 */
export const validateDemoProcessingRequest = (
  request: ParseQueueMessage
): boolean => {
  return !!(
    request.game_id &&
    request.download_url &&
    request.priority >= 1 &&
    request.priority <= 10 &&
    request.created_at &&
    request.source
  );
};
