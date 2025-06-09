import { logger } from "./app-logger";

export const createAbortController = (
  timeoutMs: number = 8000,
  timeoutMsg?: string
) => {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.error(`Request timeout (${timeoutMs}ms): ${timeoutMsg}`);
  }, timeoutMs);

  const clearAbortTimeout = () => {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    return duration;
  };

  return { controller, clearAbortTimeout };
};
