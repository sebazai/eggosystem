import { logger } from "../utils/app-logger";
import {
  createDemoProcessingRequest,
  publishToParseQueue
} from "./parse-queue.services";

/**
 * Publish demo processing request to parse_queue
 */
export const publishDemoProcessingRequest = async (
  matchGameId: number,
  demoUrl: string,
  source: string = "faceit",
  reparse: boolean = false
): Promise<void> => {
  try {
    const demoProcessingRequest = createDemoProcessingRequest(
      matchGameId,
      demoUrl,
      5, // Medium priority for demo processing
      source,
      reparse
    );

    await publishToParseQueue(demoProcessingRequest);

    logger.info("Demo processing request published to parse_queue", {
      matchGameId,
      demoUrl,
      queue: "parse_queue",
      request: demoProcessingRequest
    });
  } catch (error) {
    logger.error("Failed to publish demo processing request to parse_queue", {
      matchGameId,
      demoUrl,
      queue: "parse_queue",
      error
    });
    // Don't throw - this is a non-critical operation
  }
};
