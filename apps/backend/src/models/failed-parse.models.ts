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
import { getMatchIdByGameId } from "./match-game.models";
import { getMatchGame } from "./match.models";

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
 * Helper function to create AMQP connection and channel
 * Returns both connection and channel for cleanup purposes
 */
const createAmqpConnection = async () => {
  const connection = await amqp.connect(getConnectionUri());
  const channel = await connection.createChannel();
  return { connection, channel };
};

/**
 * Helper function to get error queue names
 * Returns filtered queue or default queues based on queueFilter parameter
 */
const getErrorQueues = (queueFilter?: string): string[] => {
  return queueFilter
    ? [queueFilter]
    : ["parse_queue_failed", "parsed_save_failed", "work_queue_failed"];
};

/**
 * Helper function to process error queues with a custom processor function
 * Handles AMQP connection, queue assertion, and error handling
 */
const processErrorQueues = async <T>(
  queueFilter: string | undefined,
  processor: (channel: amqp.Channel, queueName: string) => Promise<T>
): Promise<T[]> => {
  const { connection, channel } = await createAmqpConnection();
  const errorQueues = getErrorQueues(queueFilter);
  const results: T[] = [];

  try {
    for (const queueName of errorQueues) {
      try {
        await channel.assertQueue(queueName, { durable: true });
        const result = await processor(channel, queueName);
        results.push(result);
      } catch (error) {
        logger.error(`Error processing queue ${queueName}:`, error);
        // Continue processing other queues even if one fails
      }
    }
  } finally {
    await channel.close();
    await connection.close();
  }

  return results;
};

/**
 * Helper function that returns AMQP channel and error queue names
 * Useful for functions that need to manage their own connection lifecycle
 */
const getChannelAndQueues = async (queueFilter?: string) => {
  const { connection, channel } = await createAmqpConnection();
  const errorQueues = getErrorQueues(queueFilter);
  return { connection, channel, errorQueues };
};

/**
 * Helper function to extract match_game_id from different queue message formats
 */
const extractGameId = (
  messageContent: Record<string, unknown>,
  queueName: string
): string => {
  if (queueName === "parse_queue_failed") {
    return (messageContent?.match_game_id as string) || "unknown";
  } else if (queueName === "parsed_save_failed") {
    // For parsed_save_failed: match_game_id is directly in messageContent or in originalMessage.match_game_id
    const originalMessage = messageContent.originalMessage as
      | Record<string, unknown>
      | undefined;
    return (
      (messageContent.match_game_id as string) ||
      (originalMessage?.match_game_id as string) ||
      "unknown"
    );
  } else if (queueName === "work_queue_failed") {
    // For work_queue_failed: match_game_id might be in different locations depending on the message structure
    const originalMessage = messageContent.original_message as
      | Record<string, unknown>
      | undefined;
    return (
      (messageContent.match_game_id as string) ||
      (originalMessage?.match_game_id as string) ||
      (messageContent.match_id as string) || // Some work queue messages might use match_id
      "unknown"
    );
  } else {
    // Fallback for other queue types
    const originalMessage = messageContent.original_message as
      | Record<string, unknown>
      | undefined;
    return (
      (messageContent.match_game_id as string) ||
      (originalMessage?.match_game_id as string) ||
      "unknown"
    );
  }
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
    const queueMessages = await processErrorQueues(
      queueFilter,
      async (channel, queueName) => {
        // Get queue information first
        const queueInfo = await channel.checkQueue(queueName).catch(() => null);
        if (!queueInfo) {
          logger.warn(`Queue ${queueName} does not exist`);
          return [];
        }

        // Read messages from the queue by consuming and requeuing them
        // This ensures we get a proper sample from across the entire queue
        const messages: FailedParseMessage[] = [];
        const tempMessages: Array<{
          msg: amqp.Message;
          content: Record<string, unknown> | null;
        }> = []; // Store messages temporarily for requeuing

        // First pass: consume all messages to get a proper sample
        let totalMessages = 0;
        while (true) {
          const msg = await channel.get(queueName, { noAck: false });
          if (!msg) {
            break; // No more messages
          }

          try {
            const messageContent = JSON.parse(msg.content.toString());
            tempMessages.push({ msg, content: messageContent });
            totalMessages++;
          } catch (parseError) {
            logger.error(
              `Failed to parse message from ${queueName}:`,
              parseError
            );
            // Still store the message for requeuing
            tempMessages.push({ msg, content: null });
            totalMessages++;
          }
        }

        // Calculate sampling strategy for pagination
        const startIndex = offset;
        const endIndex = Math.min(offset + limit, totalMessages);

        // Process the sampled messages
        for (let i = startIndex; i < endIndex; i++) {
          const { msg, content } = tempMessages[i];

          if (content) {
            const parseError = content.parse_error as
              | Record<string, unknown>
              | undefined;
            const failedMessage: FailedParseMessage = {
              id: parseInt(
                `${queueName.charCodeAt(0)}${queueName.charCodeAt(queueName.length - 1)}${String(i + 1).padStart(3, "0")}`
              ), // Unique ID combining queue and position
              queue_name: queueName,
              match_game_id: extractGameId(content, queueName),
              failed_at:
                (parseError?.failed_at as string) ||
                (content.failed_at as string) ||
                (content.timestamp as string) ||
                (content.created_at as string) ||
                "",
              final_error:
                (parseError?.final_error as string) ||
                (content.final_error as string) ||
                (content.error as string) ||
                "Unknown error",
              original_message:
                (content.original_message as Record<string, unknown>) ||
                content,
              error_details:
                (content.error_details as Record<string, unknown>) ||
                (content.error_history as Record<string, unknown>) ||
                (parseError?.error_history as Record<string, unknown>) ||
                {},
              worker_id:
                (parseError?.worker_id as string) ??
                (content.worker_id as string | undefined),
              message_type:
                (parseError?.message_type as string) ||
                (content.message_type as string) ||
                queueName,
              source:
                (content.source as string) ||
                ((content.original_message as Record<string, unknown>)
                  ?.source as string) ||
                "unknown",
              status: "failed",
              created_at:
                (content.created_at as string) ??
                (parseError?.failed_at as string) ??
                "",
              updated_at:
                (content.updated_at as string) ??
                (parseError?.failed_at as string) ??
                "",
              _rabbitMQMessage: msg // Store reference for later requeuing
            };

            messages.push(failedMessage);
          }
        }

        // Requeue all messages back to the queue
        for (const { msg } of tempMessages) {
          channel.nack(msg, false, true);
        }

        return messages;
      }
    );

    const allMessages = queueMessages.flat();
    const result = allMessages.slice(offset, offset + limit);

    logger.info(
      "Generated message IDs for failed parse display",
      result.map((msg) => ({
        id: msg.id,
        match_game_id: msg.match_game_id,
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
    const queueCounts = await processErrorQueues(
      queueFilter,
      async (channel, queueName) => {
        const queueInfo = await channel.assertQueue(queueName, {
          durable: true
        });
        if (!statusFilter || statusFilter === "failed") {
          return queueInfo.messageCount;
        }
        return 0;
      }
    );

    return queueCounts.reduce((total, count) => total + count, 0);
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
 * Reparse failed messages by consuming from error queues.
 * Only messages whose match_game_id is in the request are requeued and acked;
 * others are nack'd with requeue so they remain in the error queue.
 */
export const reparseFailedMessages = async (
  request: ReparseRequest
): Promise<ReparseResponse> => {
  const { match_game_ids, priority = 5 } = request;
  const requestedIds = new Set(match_game_ids);

  if (requestedIds.size === 0) {
    return {
      success: true,
      requeued_count: 0,
      failed_count: 0
    };
  }

  logger.info("Starting reparse of failed messages from RabbitMQ", {
    matchGameIds: match_game_ids,
    priority
  });

  try {
    const { connection, channel, errorQueues } = await getChannelAndQueues();
    let requeuedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const queueName of errorQueues) {
      if (requestedIds.size === 0) break;

      try {
        await channel.assertQueue(queueName, { durable: true });

        while (true) {
          const msg = await channel.get(queueName, { noAck: false });
          if (!msg) break;

          try {
            const messageContent = JSON.parse(msg.content.toString());

            // Extract match_game_id, download_url, and original source based on queue type
            let matchGameId: string;
            let downloadUrl: string;
            let originalSource: string;

            if (queueName === "parse_queue_failed") {
              // Support both wrapped (original_message) and flat message shapes
              const orig = messageContent.original_message as
                | Record<string, unknown>
                | undefined;
              matchGameId =
                (orig?.match_game_id as string) ??
                (messageContent.match_game_id as string);
              downloadUrl =
                (orig?.download_url as string) ??
                (messageContent.download_url as string);
              originalSource =
                (orig?.source as string) ??
                (messageContent.source as string) ??
                "faceit";
            } else if (queueName === "parsed_save_failed") {
              matchGameId =
                messageContent.match_game_id ||
                messageContent.originalMessage?.match_game_id;
              downloadUrl =
                messageContent.originalMessage?.download_url ||
                messageContent.originalMessage?.demo_file ||
                "";
              originalSource =
                messageContent.source ||
                messageContent.originalMessage?.source ||
                "faceit";
            } else {
              matchGameId = messageContent.match_game_id;
              downloadUrl =
                messageContent.download_url || messageContent.demo_file || "";
              originalSource = messageContent.source || "faceit";

              // work_queue_failed may have demo_file as worker path; resolve URL from DB if needed
              const matchGameIdNum = parseInt(matchGameId, 10);
              if (
                queueName === "work_queue_failed" &&
                matchGameId &&
                (!downloadUrl || downloadUrl.startsWith("/"))
              ) {
                try {
                  const [matchIdRow] = await getMatchIdByGameId(matchGameIdNum);
                  if (matchIdRow) {
                    const [game] = await getMatchGame(
                      matchIdRow.match_id,
                      matchGameIdNum
                    );
                    if (game?.demofile && game.demofile.startsWith("http")) {
                      downloadUrl = game.demofile;
                    }
                  }
                } catch (lookupError) {
                  logger.warn(
                    "Failed to resolve demo URL from DB for reparse",
                    {
                      matchGameId,
                      error:
                        lookupError instanceof Error
                          ? lookupError.message
                          : String(lookupError)
                    }
                  );
                }
              }
            }

            const matchGameIdNum = parseInt(matchGameId, 10);
            const isRequested = requestedIds.has(matchGameIdNum);

            if (!isRequested) {
              channel.nack(msg, false, true);
              continue;
            }

            if (!matchGameId || !downloadUrl) {
              failedCount++;
              requestedIds.delete(matchGameIdNum);
              errors.push(
                `match_game_id ${matchGameId}: Missing match_game_id or download_url`
              );
              channel.ack(msg);
              continue;
            }

            // Create a new parse request with original source preserved
            const parseRequest = createDemoProcessingRequest(
              matchGameIdNum,
              downloadUrl,
              priority,
              originalSource,
              true
            );

            await publishToParseQueue(parseRequest);
            channel.ack(msg);
            requestedIds.delete(matchGameIdNum);
            requeuedCount++;

            logger.info("Successfully requeued failed message from RabbitMQ", {
              queueName,
              matchGameId,
              downloadUrl: downloadUrl.substring(0, 50) + "...",
              originalSource,
              reparse: true
            });
          } catch (processingError) {
            const matchGameId = (() => {
              try {
                const c = JSON.parse(msg.content.toString());
                if (queueName === "parse_queue_failed") {
                  const orig = c.original_message as
                    | Record<string, unknown>
                    | undefined;
                  return orig?.match_game_id ?? c.match_game_id;
                }
                if (queueName === "parsed_save_failed")
                  return c.match_game_id ?? c.originalMessage?.match_game_id;
                return c.match_game_id;
              } catch {
                return null;
              }
            })();
            const matchGameIdNum =
              matchGameId != null ? parseInt(String(matchGameId), 10) : null;
            if (matchGameIdNum != null && requestedIds.has(matchGameIdNum)) {
              failedCount++;
              requestedIds.delete(matchGameIdNum);
              errors.push(
                `match_game_id ${matchGameIdNum}: ${processingError instanceof Error ? processingError.message : String(processingError)}`
              );
            }
            channel.nack(msg, false, true);
            logger.error("Failed to process message from RabbitMQ", {
              queueName,
              error:
                processingError instanceof Error
                  ? processingError.message
                  : String(processingError)
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
      failed_count: match_game_ids.length,
      errors: ["Failed to connect to RabbitMQ"]
    };
  }
};

/**
 * Get statistics about failed parse messages from RabbitMQ queues
 */
export const getFailedParseMessagesStats = async () => {
  try {
    const queueStats = await processErrorQueues(
      undefined,
      async (channel, queueName) => {
        const queueInfo = await channel.assertQueue(queueName, {
          durable: true
        });
        const messageCount = queueInfo.messageCount;

        return {
          total_count: messageCount,
          failed_count: messageCount,
          requeued_count: 0,
          resolved_count: 0,
          queue_name: queueName
        };
      }
    );

    const totalMessages = queueStats.reduce(
      (total, stat) => total + stat.total_count,
      0
    );

    // Add total row
    const results = [
      ...queueStats,
      {
        total_count: totalMessages,
        failed_count: totalMessages,
        requeued_count: 0,
        resolved_count: 0,
        queue_name: "TOTAL"
      }
    ];

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
