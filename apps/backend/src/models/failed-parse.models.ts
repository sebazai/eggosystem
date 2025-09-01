import amqp from "amqplib";
import {
  publishToParseQueue,
  createDemoProcessingRequest
} from "../services/parse-queue.services";
import type {
  FailedParseMessage,
  ReparseRequest,
  ReparseResponse
} from "@eggosystem/types";
import { logger } from "../utils/app-logger";

/**
 * RabbitMQ connection configuration
 */
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "eggo-rabbitmq";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "test";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "test";

const getConnectionUri = () => {
  return `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
};

/**
 * Get all failed parse messages from RabbitMQ queues
 */
export const getFailedParseMessages = async (
  limit: number = 50,
  offset: number = 0,
  queueFilter?: string,
  _statusFilter?: string
): Promise<FailedParseMessage[]> => {
  // For now, return empty array if RabbitMQ connection fails
  // This prevents the frontend from crashing when RabbitMQ is not available
  try {
    const connection = await amqp.connect(getConnectionUri());
    const channel = await connection.createChannel();

    const errorQueues = queueFilter
      ? [queueFilter]
      : ["parse_queue_failed", "parsed_save_failed"];

    const allMessages: FailedParseMessage[] = [];

    for (const queueName of errorQueues) {
      try {
        await channel.assertQueue(queueName, { durable: true });

        // Get queue information first
        const queueInfo = await channel.checkQueue(queueName).catch(() => null);
        if (!queueInfo) {
          logger.warn(`Queue ${queueName} does not exist`);
          continue;
        }

        // Read messages from the queue without consuming them
        // We'll peek at messages to display them in the admin interface
        let messageCount = 0;
        const maxMessages = limit + offset; // Get enough messages to handle pagination

        while (messageCount < maxMessages) {
          const msg = await channel.get(queueName, { noAck: false });
          if (!msg) {
            break; // No more messages
          }

          try {
            const messageContent = JSON.parse(msg.content.toString());

            // Create FailedParseMessage from the RabbitMQ message
            const failedMessage: FailedParseMessage = {
              id: messageCount + 1, // Sequential ID for display
              queue_name: queueName,
              game_id:
                messageContent.original_message?.game_id ||
                messageContent.game_id ||
                "unknown",
              failed_at:
                messageContent.failed_at ||
                messageContent.timestamp ||
                new Date().toISOString(),
              final_error:
                messageContent.final_error ||
                messageContent.error ||
                "Unknown error",
              original_message:
                messageContent.original_message || messageContent,
              error_details:
                messageContent.error_details ||
                messageContent.error_history ||
                {},
              worker_id: messageContent.worker_id,
              message_type: messageContent.message_type || queueName,
              source: messageContent.source,
              status: "failed",
              created_at: messageContent.created_at || new Date().toISOString(),
              updated_at: messageContent.updated_at || new Date().toISOString(),
              _rabbitMQMessage: msg // Store reference for later requeuing
            };

            allMessages.push(failedMessage);

            // Important: Return the message back to the queue (nack without requeue=false would requeue)
            // We use nack with requeue=true to put the message back exactly where it was
            channel.nack(msg, false, true);

            messageCount++;
          } catch (parseError) {
            logger.error(
              `Failed to parse message from ${queueName}:`,
              parseError
            );
            // Still nack the message to put it back
            channel.nack(msg, false, true);
            messageCount++;
          }
        }
      } catch (queueError) {
        logger.error(`Failed to read from queue ${queueName}`, queueError);
      }
    }

    await channel.close();
    await connection.close();

    const result = allMessages.slice(offset, offset + limit);
    logger.info(
      "Generated message IDs for failed parse display",
      result.map((msg) => ({
        id: msg.id,
        game_id: msg.game_id,
        queue_name: msg.queue_name
      }))
    );

    return result;
  } catch (error) {
    logger.error(
      "Failed to connect to RabbitMQ for reading failed messages",
      error
    );
    return []; // Return empty array on connection failure
  }
};

/**
 * Get count of failed parse messages from RabbitMQ queues
 */
export const getFailedParseMessagesCount = async (
  queueFilter?: string,
  statusFilter?: string
): Promise<number> => {
  try {
    const connection = await amqp.connect(getConnectionUri());
    const channel = await connection.createChannel();

    const errorQueues = queueFilter
      ? [queueFilter]
      : ["parse_queue_failed", "parsed_save_failed"];

    let totalCount = 0;

    for (const queueName of errorQueues) {
      try {
        const queueInfo = await channel.assertQueue(queueName, {
          durable: true
        });
        if (!statusFilter || statusFilter === "failed") {
          totalCount += queueInfo.messageCount;
        }
      } catch (queueError) {
        logger.error(`Failed to get count from queue ${queueName}`, queueError);
      }
    }

    await channel.close();
    await connection.close();

    return totalCount;
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ for counting messages", error);
    return 0;
  }
};

/**
 * Get failed parse message by ID (not supported with RabbitMQ)
 */
export const getFailedParseMessageById = async (
  id: number
): Promise<FailedParseMessage | null> => {
  logger.warn(
    "getFailedParseMessageById called - not supported with RabbitMQ backend",
    { id }
  );
  return null;
};

/**
 * Reparse failed messages by consuming from error queues
 */
export const reparseFailedMessages = async (
  request: ReparseRequest
): Promise<ReparseResponse> => {
  const { message_ids, priority = 5, source = "admin-reparse" } = request;
  const messagesToProcess = message_ids.length;

  if (messagesToProcess === 0) {
    return {
      success: true,
      requeued_count: 0,
      failed_count: 0
    };
  }

  logger.info("Starting reparse of failed messages from RabbitMQ", {
    messageCount: messagesToProcess,
    priority,
    source
  });

  try {
    const connection = await amqp.connect(getConnectionUri());
    const channel = await connection.createChannel();

    const errorQueues = ["parse_queue_failed", "parsed_save_failed"];
    let requeuedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const queueName of errorQueues) {
      try {
        await channel.assertQueue(queueName, { durable: true });

        // Process up to the requested number of messages
        let processedFromThisQueue = 0;
        const maxToProcessFromQueue = Math.ceil(
          messagesToProcess / errorQueues.length
        );

        while (
          processedFromThisQueue < maxToProcessFromQueue &&
          requeuedCount + failedCount < messagesToProcess
        ) {
          const msg = await channel.get(queueName, { noAck: false });

          if (!msg) {
            break; // No more messages in this queue
          }

          try {
            const messageContent = JSON.parse(msg.content.toString());

            // Extract game_id and download_url based on queue type
            let gameId: string;
            let downloadUrl: string;

            if (queueName === "parse_queue_failed") {
              gameId = messageContent.original_message?.game_id;
              downloadUrl = messageContent.original_message?.download_url;
            } else if (queueName === "parsed_save_failed") {
              gameId =
                messageContent.game_id ||
                messageContent.originalMessage?.game_id;
              downloadUrl =
                messageContent.originalMessage?.download_url ||
                messageContent.originalMessage?.demo_file ||
                "";
            } else {
              gameId = messageContent.game_id;
              downloadUrl =
                messageContent.download_url || messageContent.demo_file || "";
            }

            if (!gameId || !downloadUrl) {
              failedCount++;
              errors.push(
                `Message from ${queueName}: Missing game_id or download_url`
              );
              channel.ack(msg);
              processedFromThisQueue++;
              continue;
            }

            // Create a new parse request
            const parseRequest = createDemoProcessingRequest(
              parseInt(gameId),
              downloadUrl,
              priority,
              source,
              true // Set reparse flag
            );

            // Submit to parse queue
            await publishToParseQueue(parseRequest);

            // Acknowledge the original message to remove it from error queue
            channel.ack(msg);

            requeuedCount++;
            processedFromThisQueue++;

            logger.info("Successfully requeued failed message from RabbitMQ", {
              queueName,
              gameId,
              downloadUrl: downloadUrl.substring(0, 50) + "..."
            });
          } catch (processingError) {
            failedCount++;
            const errorMsg = `Message from ${queueName}: ${processingError instanceof Error ? processingError.message : String(processingError)}`;
            errors.push(errorMsg);

            channel.ack(msg);
            processedFromThisQueue++;

            logger.error("Failed to process message from RabbitMQ", {
              queueName,
              error: errorMsg
            });
          }
        }
      } catch (queueError) {
        logger.error(`Failed to process queue ${queueName}`, queueError);
      }
    }

    await channel.close();
    await connection.close();

    const response: ReparseResponse = {
      success: requeuedCount > 0,
      requeued_count: requeuedCount,
      failed_count: failedCount
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    logger.info("Completed RabbitMQ reparse operation", response);
    return response;
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ for reparse", error);
    return {
      success: false,
      requeued_count: 0,
      failed_count: messagesToProcess,
      errors: ["Failed to connect to RabbitMQ"]
    };
  }
};

/**
 * Get statistics about failed parse messages from RabbitMQ queues
 */
export const getFailedParseMessagesStats = async () => {
  try {
    const connection = await amqp.connect(getConnectionUri());
    const channel = await connection.createChannel();

    const errorQueues = ["parse_queue_failed", "parsed_save_failed"];
    const results: Array<{
      total_count: number;
      failed_count: number;
      requeued_count: number;
      resolved_count: number;
      queue_name: string;
    }> = [];

    let totalMessages = 0;

    for (const queueName of errorQueues) {
      try {
        const queueInfo = await channel.assertQueue(queueName, {
          durable: true
        });
        const messageCount = queueInfo.messageCount;

        results.push({
          total_count: messageCount,
          failed_count: messageCount,
          requeued_count: 0,
          resolved_count: 0,
          queue_name: queueName
        });

        totalMessages += messageCount;
      } catch (queueError) {
        logger.error(`Failed to get stats for queue ${queueName}`, queueError);
        results.push({
          total_count: 0,
          failed_count: 0,
          requeued_count: 0,
          resolved_count: 0,
          queue_name: queueName
        });
      }
    }

    // Add total row
    results.push({
      total_count: totalMessages,
      failed_count: totalMessages,
      requeued_count: 0,
      resolved_count: 0,
      queue_name: "TOTAL"
    });

    await channel.close();
    await connection.close();

    return results;
  } catch (error) {
    logger.error("Failed to get RabbitMQ queue statistics", error);
    return [
      {
        total_count: 0,
        failed_count: 0,
        requeued_count: 0,
        resolved_count: 0,
        queue_name: "TOTAL"
      }
    ];
  }
};
