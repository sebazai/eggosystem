import amqp from "amqplib";
import { logger } from "../utils/app-logger";

// RabbitMQ connection configuration
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "eggo-rabbitmq";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "test";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "test";
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || "/";

const PARSE_QUEUE = "parse_queue";

// Connection URI
const getConnectionUri = () => {
  if (RABBITMQ_VHOST === "/") {
    return `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
  }
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

    // Ensure queue exists - assertQueue will create it if it doesn't exist
    await channel.assertQueue(PARSE_QUEUE, {
      durable: true
    });
    logger.info("Ensured parse queue exists with durable settings");

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
      messageId: `parse-${request.match_game_id}-${Date.now()}`,
      timestamp: Date.now()
    });

    if (!published) {
      throw new Error("Failed to publish message to parse_queue");
    }

    logger.info(
      `Published demo processing request to parse_queue for match_game_id: ${request.match_game_id}`
    );

    return;
  } catch (error) {
    const downloadUrlForLog =
      request.source === "manual"
        ? `${request.download_url.slice(0, 64)}…`
        : request.download_url;
    logger.error("Error publishing demo processing request to parse_queue", {
      matchGameId: request.match_game_id,
      downloadUrl: downloadUrlForLog,
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
 * Create a demo processing request object
 * @param matchGameId The game ID
 * @param downloadUrl The demo download URL
 * @param priority The priority level (1-10, default 5)
 * @param source The source of the request
 * @returns A ParseQueueMessage object
 */
export const createDemoProcessingRequest = (
  matchGameId: number,
  downloadUrl: string,
  priority: number = 5,
  source: string = "game-processor",
  reparse: boolean = false
): ParseQueueMessage => {
  return {
    match_game_id: matchGameId.toString(),
    download_url: downloadUrl,
    priority,
    created_at: new Date().toISOString(),
    source,
    reparse
  };
};
