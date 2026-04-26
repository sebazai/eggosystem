import type { Job } from "bullmq";
import { Worker } from "bullmq";
import type {
  FailedParseJobEvent,
  FailedParseJobKind
} from "@eggosystem/types";
import { logger } from "../utils/app-logger";
import {
  reparseFailedMessages,
  requeue2ddataFailedMessages,
  requeueAllFailedMessages
} from "../models/failed-parse.models";
import { publishFailedParseJobEvent } from "./failed-parse-job-events.services";
import type { FailedParseBackgroundJobPayload } from "./failed-parse-background-queue.services";

const QUEUE_NAME = "failed-parse-background";

const getConnection = () => ({
  host: process.env.REDIS_HOST ?? "eggo-redis",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
});

let worker: Worker | null = null;

const processJob = async (job: Job<FailedParseBackgroundJobPayload>) => {
  const jobPublicId = String(job.id);
  const data = job.data;
  const kind: FailedParseJobKind = data.kind;
  const { userId } = data;

  const started: FailedParseJobEvent = {
    job_id: jobPublicId,
    kind,
    status: "started"
  };

  if (data.kind === "reparse") {
    started.requested_count = data.body.match_game_ids.length;
    started.match_game_ids = data.body.match_game_ids;
  } else if (data.kind === "requeue2ddata") {
    started.requested_count = data.body.items.length;
  }

  await publishFailedParseJobEvent(userId, started);

  try {
    if (data.kind === "reparse") {
      const result = await reparseFailedMessages(data.body, {
        onProgress: (p) => {
          void publishFailedParseJobEvent(userId, {
            job_id: jobPublicId,
            kind,
            status: "progress",
            requested_count: data.body.match_game_ids.length,
            match_game_ids: data.body.match_game_ids,
            processed_count: p.processed_count,
            requeued_count: p.requeued_count,
            failed_count: p.failed_count,
            requeued_match_game_ids: p.requeued_match_game_ids
          });
        }
      });
      await publishFailedParseJobEvent(userId, {
        job_id: jobPublicId,
        kind,
        status: result.success ? "completed" : "failed",
        requested_count: data.body.match_game_ids.length,
        match_game_ids: data.body.match_game_ids,
        requeued_count: result.requeued_count,
        failed_count: result.failed_count,
        errors: result.errors
      });
      return;
    }

    if (data.kind === "requeue2ddata") {
      const result = await requeue2ddataFailedMessages(data.body, {
        onProgress: (p) => {
          void publishFailedParseJobEvent(userId, {
            job_id: jobPublicId,
            kind,
            status: "progress",
            requested_count: data.body.items.length,
            processed_count: p.processed_count,
            requeued_count: p.requeued_count,
            failed_count: p.failed_count,
            requeued_match_game_ids: p.requeued_match_game_ids
          });
        }
      });
      await publishFailedParseJobEvent(userId, {
        job_id: jobPublicId,
        kind,
        status: result.success ? "completed" : "failed",
        requested_count: data.body.items.length,
        requeued_count: result.requeued_count,
        failed_count: result.failed_count,
        errors: result.errors
      });
      return;
    }

    if (data.kind === "requeueAll") {
      const result = await requeueAllFailedMessages({
        ...data.body,
        onProgress: (p) => {
          void publishFailedParseJobEvent(userId, {
            job_id: jobPublicId,
            kind,
            status: "progress",
            processed_count: p.processed_count,
            total_count: p.total_count,
            requeued_count: p.requeued_count,
            failed_count: p.failed_count,
            requeued_match_game_ids: p.requeued_match_game_ids
          });
        }
      });
      await publishFailedParseJobEvent(userId, {
        job_id: jobPublicId,
        kind,
        status: result.success ? "completed" : "failed",
        requeued_count: result.requeued_count,
        failed_count: result.failed_count,
        errors: result.errors
      });
      return;
    }

    const _exhaustive: never = data;
    void _exhaustive;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed-parse background job threw", {
      jobId: jobPublicId,
      kind,
      error: message
    });
    await publishFailedParseJobEvent(userId, {
      job_id: jobPublicId,
      kind,
      status: "failed",
      message
    });
    throw error;
  }
};

export const startFailedParseBackgroundWorker = (): void => {
  if (worker) {
    logger.warn("Failed-parse background worker is already running");
    return;
  }

  logger.info("Starting failed-parse background worker...");

  worker = new Worker(QUEUE_NAME, processJob, {
    connection: getConnection(),
    concurrency: 1
  });

  worker.on("completed", (job: Job) => {
    logger.info(`Failed-parse background job ${job.id} completed`);
  });

  worker.on("failed", (job: Job | undefined, error: Error) => {
    if (job) {
      logger.error(
        `Failed-parse background job ${job.id} failed after ${job.attemptsMade} attempts`,
        error
      );
    } else {
      logger.error("Failed-parse background job failed (job undefined)", error);
    }
  });

  worker.on("error", (error: Error) => {
    logger.error("Failed-parse background worker error", error);
  });

  logger.info("Failed-parse background worker started successfully");
};

export const stopFailedParseBackgroundWorker = async (): Promise<void> => {
  if (!worker) {
    return;
  }
  logger.info("Stopping failed-parse background worker...");
  try {
    await worker.close();
  } catch (error) {
    logger.error("Error stopping failed-parse background worker", error);
  } finally {
    worker = null;
  }
};
