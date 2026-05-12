import amqp from "amqplib";
import {
  publishToParseQueue,
  createDemoProcessingRequest
} from "../services/parse-queue.services";
import { publishToParse2ddataQueue } from "../services/parse-2ddata-queue.services";
import {
  getMessagesFromQueue,
  getQueueInfo
} from "../services/rabbitmq-management.services";
import type {
  FailedParseMessage,
  ReparseRequest,
  ReparseResponse,
  Requeue2ddataRequest,
  Requeue2ddataResponse
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
    : [
        "parse_queue_failed",
        "parsed_save_failed",
        "work_queue_failed",
        "parse_2ddata_failed"
      ];
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
  if (queueFilter) {
    try {
      // RabbitMQ management API can only return the first N messages.
      // To support server-side pagination (offset/limit), we request up to offset+limit
      // and slice on the backend.
      const countToFetch = Math.min(offset + limit, 2000);
      const raw = await getMessagesFromQueue(queueFilter, countToFetch);

      const parsed = raw
        .map((m, idx) => {
          const body = (() => {
            try {
              return JSON.parse(m.payload) as Record<string, unknown>;
            } catch {
              return { payload: m.payload } as Record<string, unknown>;
            }
          })();

          const matchGameId = extractGameId(body, queueFilter);
          const parseError = body.parse_error as
            | Record<string, unknown>
            | undefined;

          const id = parseInt(
            `${queueFilter.charCodeAt(0)}${queueFilter.charCodeAt(queueFilter.length - 1)}${String(idx + 1).padStart(3, "0")}`
          );

          const msg: FailedParseMessage = {
            id,
            queue_name: queueFilter,
            match_game_id: matchGameId,
            failed_at:
              (parseError?.failed_at as string) ||
              (body.failed_at as string) ||
              (body.timestamp as string) ||
              (body.created_at as string) ||
              "",
            final_error:
              (parseError?.final_error as string) ||
              (body.final_error as string) ||
              (body.error as string) ||
              "Unknown error",
            original_message:
              (body.original_message as Record<string, unknown>) || body,
            error_details:
              (body.error_details as Record<string, unknown>) ||
              (body.error_history as Record<string, unknown>) ||
              (parseError?.error_history as Record<string, unknown>) ||
              {},
            worker_id:
              (parseError?.worker_id as string) ??
              (body.worker_id as string | undefined),
            message_type:
              (parseError?.message_type as string) ||
              (body.message_type as string) ||
              queueFilter,
            source:
              (body.source as string) ||
              ((body.original_message as Record<string, unknown>)?.source as
                | string
                | undefined) ||
              "unknown",
            status: "failed",
            created_at:
              (body.created_at as string) ??
              (parseError?.failed_at as string) ??
              "",
            updated_at:
              (body.updated_at as string) ??
              (parseError?.failed_at as string) ??
              ""
          };

          return msg;
        })
        .slice(offset, offset + limit);

      return parsed;
    } catch (error) {
      logger.error(
        `Failed to read ${queueFilter} via RabbitMQ management API`,
        error
      );
      return [];
    }
  }

  // All queues: use RabbitMQ management API across our known error queues.
  // Note: management `/get` can only return the first N messages per queue;
  // we fetch up to offset+limit from each queue, merge, then slice.
  const queues = getErrorQueues(undefined);

  try {
    const countToFetch = Math.min(offset + limit, 2000);
    const perQueueSettled = await Promise.allSettled(
      queues.map(async (queueName) => {
        const raw = await getMessagesFromQueue(queueName, countToFetch);
        return raw.map((m, idx) => ({ queueName, idx, payload: m.payload }));
      })
    );

    const perQueue = perQueueSettled.flatMap((r) => {
      if (r.status === "fulfilled") return [r.value];
      logger.warn("Skipping queue fetch due to error", {
        error: r.reason instanceof Error ? r.reason.message : String(r.reason)
      });
      return [];
    });

    const merged = perQueue.flat().map(({ queueName, idx, payload }) => {
      const body = (() => {
        try {
          return JSON.parse(payload) as Record<string, unknown>;
        } catch {
          return { payload } as Record<string, unknown>;
        }
      })();

      const matchGameId = extractGameId(body, queueName);
      const parseError = body.parse_error as
        | Record<string, unknown>
        | undefined;

      const id = parseInt(
        `${queueName.charCodeAt(0)}${queueName.charCodeAt(queueName.length - 1)}${String(idx + 1).padStart(3, "0")}`
      );

      const msg: FailedParseMessage = {
        id,
        queue_name: queueName,
        match_game_id: matchGameId,
        failed_at:
          (parseError?.failed_at as string) ||
          (body.failed_at as string) ||
          (body.timestamp as string) ||
          (body.created_at as string) ||
          "",
        final_error:
          (parseError?.final_error as string) ||
          (body.final_error as string) ||
          (body.error as string) ||
          "Unknown error",
        original_message:
          (body.original_message as Record<string, unknown>) || body,
        error_details:
          (body.error_details as Record<string, unknown>) ||
          (body.error_history as Record<string, unknown>) ||
          (parseError?.error_history as Record<string, unknown>) ||
          {},
        worker_id:
          (parseError?.worker_id as string) ??
          (body.worker_id as string | undefined),
        message_type:
          (parseError?.message_type as string) ||
          (body.message_type as string) ||
          queueName,
        source:
          (body.source as string) ||
          ((body.original_message as Record<string, unknown>)?.source as
            | string
            | undefined) ||
          "unknown",
        status: "failed",
        created_at:
          (body.created_at as string) ??
          (parseError?.failed_at as string) ??
          "",
        updated_at:
          (body.updated_at as string) ?? (parseError?.failed_at as string) ?? ""
      };

      return msg;
    });

    return merged.slice(offset, offset + limit);
  } catch (error) {
    logger.error(
      "Failed to read failed messages via RabbitMQ management API",
      error
    );
    return [];
  }
};

/**
 * Get count of failed parse messages from RabbitMQ queues
 */
export const getFailedParseMessagesCount = async (
  queueFilter?: string,
  statusFilter?: string
): Promise<number> => {
  if (queueFilter) {
    try {
      const info = await getQueueInfo(queueFilter);
      if (!statusFilter || statusFilter === "failed") {
        return info.messages;
      }
      return 0;
    } catch (error) {
      logger.error(
        "Failed to connect to RabbitMQ management for counting messages",
        error
      );
      return 0;
    }
  }

  try {
    const queues = getErrorQueues(undefined);
    const settled = await Promise.allSettled(
      queues.map(async (q) => {
        const info = await getQueueInfo(q);
        if (!statusFilter || statusFilter === "failed") return info.messages;
        return 0;
      })
    );

    return settled.reduce((sum, r) => {
      if (r.status === "fulfilled") return sum + r.value;
      logger.warn("Skipping queue count due to error", {
        error: r.reason instanceof Error ? r.reason.message : String(r.reason)
      });
      return sum;
    }, 0);
  } catch (error) {
    logger.error(
      "Failed to connect to RabbitMQ management for counting messages",
      error
    );
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
  request: ReparseRequest,
  opts?: {
    onProgress?: (p: {
      processed_count: number;
      requeued_count: number;
      failed_count: number;
      requeued_match_game_ids?: Array<number | string>;
    }) => void;
  }
): Promise<ReparseResponse> => {
  const { match_game_ids, priority = 5 } = request;
  const requestedIds = new Set(match_game_ids);
  let processedCount = 0;

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
        const queueInfo = await channel.assertQueue(queueName, {
          durable: true
        });

        // IMPORTANT:
        // Do NOT nack(requeue=true) non-requested messages immediately inside the scan loop,
        // otherwise `channel.get()` can keep returning the same front-of-queue messages and
        // the HTTP request may never finish when the selected item is deeper in the queue.
        //
        // Instead, do a bounded pass (messageCount) and requeue non-requested messages at the end.
        const messagesToRequeue: amqp.Message[] = [];

        for (let i = 0; i < queueInfo.messageCount; i++) {
          if (requestedIds.size === 0) break;
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
                (messageContent.download_url as string) ??
                (orig?.demo_path as string) ??
                (messageContent.demo_path as string) ??
                (orig?.demo_file as string) ??
                (messageContent.demo_file as string);
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
                messageContent.originalMessage?.demo_path ||
                messageContent.demo_path ||
                "";
              originalSource =
                messageContent.source ||
                messageContent.originalMessage?.source ||
                "faceit";
            } else {
              matchGameId = messageContent.match_game_id;
              downloadUrl =
                messageContent.download_url ||
                messageContent.demo_file ||
                messageContent.demo_path ||
                "";
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
              messagesToRequeue.push(msg);
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
            processedCount++;
            opts?.onProgress?.({
              processed_count: processedCount,
              requeued_count: requeuedCount,
              failed_count: failedCount,
              requeued_match_game_ids: [matchGameIdNum]
            });

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
              processedCount++;
              opts?.onProgress?.({
                processed_count: processedCount,
                requeued_count: requeuedCount,
                failed_count: failedCount,
                requeued_match_game_ids: [matchGameIdNum]
              });
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

        for (const msg of messagesToRequeue) {
          channel.nack(msg, false, true);
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

export const requeue2ddataFailedMessages = async (
  request: Requeue2ddataRequest,
  opts?: {
    onProgress?: (p: {
      processed_count: number;
      requeued_count: number;
      failed_count: number;
      requeued_match_game_ids?: Array<number | string>;
    }) => void;
  }
): Promise<Requeue2ddataResponse> => {
  const requestedKeys = new Set(
    request.items.map((i) => `${i.match_game_id}::${i.demo_path}`)
  );

  if (requestedKeys.size === 0) {
    return { success: true, requeued_count: 0, failed_count: 0 };
  }

  try {
    const { connection, channel } = await createAmqpConnection();
    let requeuedCount = 0;
    let failedCount = 0;
    let processedCount = 0;
    const errors: string[] = [];

    try {
      const queueName = "parse_2ddata_failed";
      const queueInfo = await channel.assertQueue(queueName, { durable: true });

      // IMPORTANT:
      // Do NOT nack(requeue=true) non-requested messages immediately inside the loop,
      // otherwise `channel.get()` may keep fetching the same messages again and the
      // HTTP request never returns.
      //
      // Instead, we do a bounded pass through the queue (based on messageCount),
      // then requeue all non-requested messages at the end.
      const messagesToRequeue: amqp.Message[] = [];

      for (let i = 0; i < queueInfo.messageCount; i++) {
        if (requestedKeys.size === 0) break;
        const msg = await channel.get(queueName, { noAck: false });
        if (!msg) break;

        try {
          const messageContent = JSON.parse(msg.content.toString()) as Record<
            string,
            unknown
          >;
          const matchGameId = String(messageContent.match_game_id ?? "");
          const demoPath = String(messageContent.demo_path ?? "");
          const key = `${matchGameId}::${demoPath}`;

          if (!requestedKeys.has(key)) {
            messagesToRequeue.push(msg);
            continue;
          }

          if (!matchGameId || !demoPath) {
            failedCount++;
            requestedKeys.delete(key);
            errors.push(`key ${key}: Missing match_game_id or demo_path`);
            channel.ack(msg);
            continue;
          }

          const payloadToPublish: Record<string, unknown> = {
            ...messageContent
          };
          delete payloadToPublish.retry_count;

          await publishToParse2ddataQueue(payloadToPublish);
          channel.ack(msg);
          requestedKeys.delete(key);
          requeuedCount++;
          processedCount++;
          opts?.onProgress?.({
            processed_count: processedCount,
            requeued_count: requeuedCount,
            failed_count: failedCount,
            requeued_match_game_ids: [matchGameId]
          });
        } catch (processingError) {
          try {
            const raw = JSON.parse(msg.content.toString()) as Record<
              string,
              unknown
            >;
            const key = `${String(raw.match_game_id ?? "")}::${String(raw.demo_path ?? "")}`;
            if (requestedKeys.has(key)) {
              failedCount++;
              requestedKeys.delete(key);
              errors.push(
                `key ${key}: ${processingError instanceof Error ? processingError.message : String(processingError)}`
              );
              processedCount++;
              opts?.onProgress?.({
                processed_count: processedCount,
                requeued_count: requeuedCount,
                failed_count: failedCount,
                requeued_match_game_ids: [key]
              });
            }
          } catch {
            // ignore
          }

          // On error, requeue the message back to parse_2ddata_failed
          channel.nack(msg, false, true);
        }
      }

      // Requeue all non-requested messages back to the failed queue
      for (const msg of messagesToRequeue) {
        channel.nack(msg, false, true);
      }
    } finally {
      await channel.close();
      await connection.close();
    }

    const response: Requeue2ddataResponse = {
      success: requeuedCount > 0,
      requeued_count: requeuedCount,
      failed_count: failedCount
    };
    if (errors.length > 0) response.errors = errors;
    return response;
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ for 2ddata requeue", error);
    return {
      success: false,
      requeued_count: 0,
      failed_count: request.items.length,
      errors: ["Failed to connect to RabbitMQ"]
    };
  }
};

export const requeueAllFailedMessages = async (params: {
  queue_name: string;
  priority?: number;
  onProgress?: (p: {
    processed_count: number;
    total_count?: number;
    requeued_count: number;
    failed_count: number;
    requeued_match_game_ids?: Array<number | string>;
  }) => void;
}): Promise<ReparseResponse> => {
  const { queue_name, priority = 5 } = params;
  const onProgress = params.onProgress;

  if (!getErrorQueues(undefined).includes(queue_name)) {
    return {
      success: false,
      requeued_count: 0,
      failed_count: 1,
      errors: [`Unsupported queue_name ${queue_name}`]
    };
  }

  if (queue_name === "parse_2ddata_failed") {
    try {
      const { connection, channel } = await createAmqpConnection();
      let requeuedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      try {
        const queueInfo = await channel.assertQueue(queue_name, {
          durable: true
        });

        for (let i = 0; i < queueInfo.messageCount; i++) {
          const msg = await channel.get(queue_name, { noAck: false });
          if (!msg) break;

          try {
            const messageContent = JSON.parse(msg.content.toString()) as Record<
              string,
              unknown
            >;
            const payloadToPublish: Record<string, unknown> = {
              ...messageContent
            };
            delete payloadToPublish.retry_count;

            await publishToParse2ddataQueue(payloadToPublish);
            channel.ack(msg);
            requeuedCount++;
            onProgress?.({
              processed_count: i + 1,
              total_count: queueInfo.messageCount,
              requeued_count: requeuedCount,
              failed_count: failedCount
            });
          } catch (error) {
            channel.nack(msg, false, true);
            failedCount++;
            errors.push(error instanceof Error ? error.message : String(error));
            onProgress?.({
              processed_count: i + 1,
              total_count: queueInfo.messageCount,
              requeued_count: requeuedCount,
              failed_count: failedCount
            });
          }
        }
      } finally {
        await channel.close();
        await connection.close();
      }

      const response: ReparseResponse = {
        success: requeuedCount > 0,
        requeued_count: requeuedCount,
        failed_count: failedCount
      };
      if (errors.length > 0) response.errors = errors;
      return response;
    } catch (error) {
      logger.error(
        "Failed to connect to RabbitMQ for requeue-all 2ddata",
        error
      );
      return {
        success: false,
        requeued_count: 0,
        failed_count: 1,
        errors: ["Failed to connect to RabbitMQ"]
      };
    }
  }

  // For parse_queue_failed / parsed_save_failed / work_queue_failed:
  // consume all messages and publish back to parse_queue.
  try {
    const { connection, channel } = await createAmqpConnection();
    let requeuedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      const queueInfo = await channel.assertQueue(queue_name, {
        durable: true
      });

      for (let i = 0; i < queueInfo.messageCount; i++) {
        const msg = await channel.get(queue_name, { noAck: false });
        if (!msg) break;

        try {
          const messageContent = JSON.parse(msg.content.toString());

          let matchGameId: string;
          let downloadUrl: string;
          let originalSource: string;

          if (queue_name === "parse_queue_failed") {
            const orig = messageContent.original_message as
              | Record<string, unknown>
              | undefined;
            matchGameId =
              (orig?.match_game_id as string) ??
              (messageContent.match_game_id as string);
            downloadUrl =
              (orig?.download_url as string) ??
              (messageContent.download_url as string) ??
              (orig?.demo_path as string) ??
              (messageContent.demo_path as string) ??
              (orig?.demo_file as string) ??
              (messageContent.demo_file as string);
            originalSource =
              (orig?.source as string) ??
              (messageContent.source as string) ??
              "faceit";
          } else if (queue_name === "parsed_save_failed") {
            matchGameId =
              messageContent.match_game_id ||
              messageContent.originalMessage?.match_game_id;
            downloadUrl =
              messageContent.originalMessage?.download_url ||
              messageContent.originalMessage?.demo_file ||
              messageContent.originalMessage?.demo_path ||
              messageContent.demo_path ||
              "";
            originalSource =
              messageContent.source ||
              messageContent.originalMessage?.source ||
              "faceit";
          } else {
            matchGameId = messageContent.match_game_id;
            downloadUrl =
              messageContent.download_url ||
              messageContent.demo_file ||
              messageContent.demo_path ||
              "";
            originalSource = messageContent.source || "faceit";
          }

          const matchGameIdNum = parseInt(String(matchGameId), 10);
          if (!matchGameId || !downloadUrl || Number.isNaN(matchGameIdNum)) {
            failedCount++;
            errors.push(
              `Missing match_game_id or demo_path for queue ${queue_name}`
            );
            channel.ack(msg);
            onProgress?.({
              processed_count: i + 1,
              total_count: queueInfo.messageCount,
              requeued_count: requeuedCount,
              failed_count: failedCount
            });
            continue;
          }

          const parseRequest = createDemoProcessingRequest(
            matchGameIdNum,
            downloadUrl,
            priority,
            originalSource,
            true
          );

          await publishToParseQueue(parseRequest);
          channel.ack(msg);
          requeuedCount++;
          onProgress?.({
            processed_count: i + 1,
            total_count: queueInfo.messageCount,
            requeued_count: requeuedCount,
            failed_count: failedCount,
            requeued_match_game_ids: [matchGameIdNum]
          });
        } catch (error) {
          channel.nack(msg, false, true);
          failedCount++;
          errors.push(error instanceof Error ? error.message : String(error));
          onProgress?.({
            processed_count: i + 1,
            total_count: queueInfo.messageCount,
            requeued_count: requeuedCount,
            failed_count: failedCount
          });
        }
      }
    } finally {
      await channel.close();
      await connection.close();
    }

    const response: ReparseResponse = {
      success: requeuedCount > 0,
      requeued_count: requeuedCount,
      failed_count: failedCount
    };
    if (errors.length > 0) response.errors = errors;
    return response;
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ for requeue-all", error);
    return {
      success: false,
      requeued_count: 0,
      failed_count: 1,
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
      async (_channel, queueName) => {
        const info = await getQueueInfo(queueName);
        const messageCount = info.messages;

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
