import type { Request, Response } from "express";
import { logger } from "../utils/app-logger";
import { subscribeFailedParseJobEvents } from "./failed-parse-job-events.services";

const KEEPALIVE_MS = 15_000;

/**
 * Attach a Server-Sent Events stream for failed-parse background job notifications.
 * Caller must ensure `userId` is the authenticated account id.
 */
export const attachFailedParseJobSse = async (
  req: Request,
  res: Response,
  userId: number
): Promise<void> => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const resWithFlush = res as Response & { flushHeaders?: () => void };
  if (typeof resWithFlush.flushHeaders === "function") {
    resWithFlush.flushHeaders();
  }

  let subscription: { close: () => Promise<void> } | null = null;
  try {
    subscription = await subscribeFailedParseJobEvents(userId, {
      onMessage: (message) => {
        res.write(`event: failed-parse-job\ndata: ${message}\n\n`);
      }
    });
  } catch (error) {
    logger.error("Failed to subscribe to failed-parse job events", error);
    throw error;
  }

  const keepalive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, KEEPALIVE_MS);

  const cleanup = () => {
    clearInterval(keepalive);
    if (subscription) {
      void subscription.close();
      subscription = null;
    }
  };

  req.on("close", cleanup);
  req.on("aborted", cleanup);
};
