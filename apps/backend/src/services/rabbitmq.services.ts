import amqp from "amqplib";
import { logger } from "../utils/app-logger";

// RabbitMQ connection configuration
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "eggo-rabbitmq";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "test";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "test";
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || "%2F";

// Queue names
const KANAELO_CALC_QUEUE = "kanaelo_calc_queue";

// Connection URI
const getConnectionUri = () => {
  return `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}/${RABBITMQ_VHOST}`;
};

// Interface for kanaelo calculation request
interface KanaeloCalculationRequest {
  steam_id: string;
  season_id: number;
  timestamp: string;
  request_id: string;
  priority: number;
  metadata: {
    trigger: string;
    requested_by: string;
    batch_id: string;
  };
}

/**
 * Connect to RabbitMQ and create a channel
 * @returns A Promise resolving to the RabbitMQ channel
 */
const createChannel = async () => {
  try {
    const connection = await amqp.connect(getConnectionUri());
    const channel = await connection.createChannel();

    // Make sure the queue exists
    await channel.assertQueue(KANAELO_CALC_QUEUE, {
      durable: true
    });

    return { connection, channel };
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", error);
    throw error;
  }
};

/**
 * Publish a kanaelo calculation request to the queue
 * @param request The calculation request to publish
 * @returns A Promise resolving when the message is published
 */
export const publishKanaeloCalculationRequest = async (
  request: KanaeloCalculationRequest
) => {
  let connection;
  let channel;

  try {
    // Create connection and channel
    const resources = await createChannel();
    connection = resources.connection;
    channel = resources.channel;

    // Publish message to queue
    const message = Buffer.from(JSON.stringify(request));
    const published = channel.publish("", KANAELO_CALC_QUEUE, message, {
      persistent: true,
      contentType: "application/json"
    });

    if (!published) {
      throw new Error("Failed to publish message to queue");
    }

    logger.info(
      `[RabbitMQ] Published kanaelo calculation request for steam_id: ${request.steam_id}`
    );

    return { success: true, request_id: request.request_id };
  } catch (error) {
    logger.error("Error publishing kanaelo calculation request", error);
    throw error;
  } finally {
    // Close channel and connection
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
};

/**
 * Publish multiple kanaelo calculation requests to the queue
 * @param steamIds Array of steam IDs to process
 * @param seasonId The season ID for the calculations
 * @returns A Promise resolving to the number of messages published
 */
export const bulkPublishKanaeloCalculationRequests = async (
  steamIds: string[],
  seasonId: number
) => {
  let connection;
  let channel;
  let publishCount = 0;

  try {
    // Create connection and channel
    const resources = await createChannel();
    connection = resources.connection;
    channel = resources.channel;

    // Generate batch ID
    const batchId = `batch-${Date.now()}`;

    // Publish messages for each steam ID
    for (const steamId of steamIds) {
      // Ensure steamId is a string and handle it safely
      const steamIdString = String(steamId);
      const requestId = `calc-req-${Date.now()}-${steamIdString.slice(-6)}`;
      const timestamp = new Date().toISOString();

      const request: KanaeloCalculationRequest = {
        steam_id: steamIdString,
        season_id: seasonId,
        timestamp,
        request_id: requestId,
        priority: 5,
        metadata: {
          trigger: "admin_sortter_page",
          requested_by: "admin",
          batch_id: batchId
        }
      };

      const message = Buffer.from(JSON.stringify(request));
      const published = channel.publish("", KANAELO_CALC_QUEUE, message, {
        persistent: true,
        contentType: "application/json"
      });

      if (published) {
        publishCount++;
      } else {
        logger.warn(`Failed to publish message for steam_id: ${steamIdString}`);
      }
    }

    logger.info(
      `[RabbitMQ] Published ${publishCount}/${steamIds.length} kanaelo calculation requests for season ${seasonId}`
    );

    return { success: true, published: publishCount, total: steamIds.length };
  } catch (error) {
    logger.error(
      "[RabbitMQ] Error bulk publishing kanaelo calculation requests",
      error
    );
    throw error;
  } finally {
    // Close channel and connection
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
};

export default {
  publishKanaeloCalculationRequest,
  bulkPublishKanaeloCalculationRequests
};
