import amqp from "amqplib";
import { logger } from "../utils/app-logger";

// RabbitMQ connection configuration
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "eggo-rabbitmq";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "test";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "test";
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || "%2F";

// Queue names
const ERROR_QUEUE = "kanaelo_save_error_queue";
const CALC_QUEUE = "kanaelo_calc_queue";

// Connection URI
const getConnectionUri = () => {
  return `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}/${RABBITMQ_VHOST}`;
};

interface ErrorQueueMessage {
  steam_id: string;
  season_id: string;
  status: string;
  error_message: string;
  error_details: Record<string, unknown>;
  timestamp: number;
  processing_time: number;
  http_status_code: number;
  retry_count: number;
  metadata: {
    batchId: string;
  };
}

interface CalcQueueMessage {
  steam_id: string;
  season_id: string;
  timestamp: number;
  request_id: string;
  priority: number;
  metadata: {
    trigger: string;
    requested_by: string;
    batch_id: string;
    retry_count: number;
  };
}

/**
 * Connect to RabbitMQ and create a channel
 * @returns A Promise resolving to the RabbitMQ channel and connection
 */
const createChannel = async () => {
  try {
    const connection = await amqp.connect(getConnectionUri());
    const channel = await connection.createChannel();

    // Make sure the queues exist
    await channel.assertQueue(ERROR_QUEUE, {
      durable: true
    });

    await channel.assertQueue(CALC_QUEUE, {
      durable: true
    });

    return { connection, channel };
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", error);
    throw error;
  }
};

/**
 * Retry failed kanaelo calculations by moving messages from the error queue back to the calculation queue
 * @returns Object with count of messages moved and any errors
 */
export const retryFailedKanaeloCalculations = async (): Promise<{
  moved: number;
  errors: number;
  total: number;
}> => {
  let connection;
  let channel;

  try {
    // Create connection and channel
    const resources = await createChannel();
    connection = resources.connection;
    channel = resources.channel;

    // Get message count in error queue
    const { messageCount } = await channel.checkQueue(ERROR_QUEUE);

    if (messageCount === 0) {
      logger.info("No messages in error queue to retry");
      return { moved: 0, errors: 0, total: 0 };
    }

    logger.info(`Found ${messageCount} messages in error queue`);

    let moved = 0;
    let errors = 0;

    // Process messages from error queue
    for (let i = 0; i < messageCount; i++) {
      // Get a message from error queue (don't acknowledge yet)
      const message = await channel.get(ERROR_QUEUE, { noAck: false });

      if (!message) {
        logger.warn("Expected message but got null, breaking loop");
        break;
      }

      try {
        // Parse the error message
        const errorMessage = JSON.parse(
          message.content.toString()
        ) as ErrorQueueMessage;

        // Create a new calculation message
        const calcMessage: CalcQueueMessage = {
          steam_id: errorMessage.steam_id,
          season_id: errorMessage.season_id,
          timestamp: Date.now(),
          request_id: `retry-${Date.now()}-${errorMessage.steam_id}`,
          priority: 5, // Medium priority
          metadata: {
            trigger: "admin_retry",
            requested_by: "admin",
            batch_id: `retry-batch-${Date.now()}`,
            retry_count: (errorMessage.retry_count || 0) + 1
          }
        };

        // Publish to calculation queue
        const published = channel.publish(
          "",
          CALC_QUEUE,
          Buffer.from(JSON.stringify(calcMessage)),
          {
            persistent: true,
            contentType: "application/json"
          }
        );

        if (!published) {
          logger.warn(
            `Failed to publish retry message for steam_id: ${errorMessage.steam_id}`
          );
          errors++;
        } else {
          // Acknowledge the message from error queue (remove it)
          await channel.ack(message);
          moved++;
          logger.info(
            `Successfully moved message for player ${errorMessage.steam_id} to calculation queue`
          );
        }
      } catch (error) {
        // Acknowledge the message but count as error
        await channel.ack(message);
        errors++;
        logger.error(`Failed to process message: ${error}`);
      }
    }

    return { moved, errors, total: messageCount };
  } catch (error) {
    logger.error(`Error retrying failed calculations: ${error}`);
    throw error;
  } finally {
    // Close channel and connection
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (error) {
      logger.error(`Error closing RabbitMQ connections: ${error}`);
    }
  }
};
