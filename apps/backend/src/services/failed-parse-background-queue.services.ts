import { randomUUID } from "crypto";
import { Queue } from "bullmq";
import type { ReparseRequest, Requeue2ddataRequest } from "@eggosystem/types";
import { logger } from "../utils/app-logger";
import { expireIn7Days, expireIn30Days } from "../utils/redisClient";

const QUEUE_NAME = "failed-parse-background";

export type FailedParseBackgroundJobPayload =
  | { kind: "reparse"; userId: number; body: ReparseRequest }
  | { kind: "requeue2ddata"; userId: number; body: Requeue2ddataRequest }
  | {
      kind: "requeueAll";
      userId: number;
      body: { queue_name: string; priority?: number };
    };

let _queue: Queue | null = null;

const getConnection = () => ({
  host: process.env.REDIS_HOST ?? "eggo-redis",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
});

const createQueue = (queue?: Queue): Queue => {
  if (queue) return queue;
  return new Queue(QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { age: expireIn7Days },
      removeOnFail: { age: expireIn30Days }
    }
  });
};

const getFailedParseBackgroundQueue = (): Queue => {
  if (!_queue) {
    _queue = createQueue();
  }
  return _queue;
};

export const enqueueFailedParseBackgroundJob = async (
  payload: FailedParseBackgroundJobPayload,
  queue?: Queue
): Promise<{ jobId: string }> => {
  const jobId = randomUUID();
  const q = queue ?? getFailedParseBackgroundQueue();
  try {
    await q.add(payload.kind, payload, { jobId });
    logger.info("Enqueued failed-parse background job", {
      kind: payload.kind,
      jobId
    });
    return { jobId };
  } catch (error) {
    logger.error("Failed to enqueue failed-parse background job", {
      kind: payload.kind,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

export const closeFailedParseBackgroundQueue = async (): Promise<void> => {
  if (_queue) {
    try {
      await _queue.close();
    } catch (error) {
      logger.warn("Error closing failed-parse background queue", {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      _queue = null;
    }
  }
};
