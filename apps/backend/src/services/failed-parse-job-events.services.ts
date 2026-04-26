import type Redis from "ioredis";
import type { FailedParseJobEvent } from "@eggosystem/types";
import { redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";

const failedParseUserChannel = (userId: number): string =>
  `failed-parse:jobs:user:${userId}`;

export const publishFailedParseJobEvent = async (
  userId: number,
  event: FailedParseJobEvent
): Promise<void> => {
  const channel = failedParseUserChannel(userId);
  const payload = JSON.stringify(event);
  try {
    await redisClient.publish(channel, payload);
  } catch (error) {
    logger.error("Failed to publish failed-parse job event", {
      userId,
      channel,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Subscribe to per-user failed-parse job notifications (Redis Pub/Sub).
 * Uses a dedicated connection (duplicate) because the main client may be used elsewhere.
 */
export const subscribeFailedParseJobEvents = async (
  userId: number,
  handlers: { onMessage: (message: string) => void }
): Promise<{ close: () => Promise<void> }> => {
  const sub: Redis = redisClient.duplicate();
  const channel = failedParseUserChannel(userId);

  sub.on("error", (err: Error) => {
    logger.error("Failed-parse job events subscriber error", {
      userId,
      error: err.message
    });
  });

  const onMessage = (_ch: string, message: string) => {
    handlers.onMessage(message);
  };

  sub.on("message", onMessage);
  await sub.subscribe(channel);

  return {
    close: async () => {
      try {
        sub.off("message", onMessage);
        await sub.unsubscribe(channel);
      } catch (error) {
        logger.warn("Failed-parse job events unsubscribe error", {
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        try {
          await sub.quit();
        } catch (error) {
          logger.warn("Failed-parse job events subscriber quit error", {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  };
};
