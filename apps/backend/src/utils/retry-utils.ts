import { logger } from "./app-logger";
import {
  isTransientDatabaseError,
  isDatabaseError,
  type DatabaseError
} from "./database-errors";

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration options
 * @returns Promise that resolves with the function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    onRetry
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        logger.error(
          `Retry exhausted after ${maxAttempts} attempts`,
          lastError
        );
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      logger.warn(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`,
        {
          error: lastError.message,
          nextDelayMs: delay
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with max delay cap
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Retry failed");
}

/**
 * Retry a database transaction with exponential backoff for transient errors
 * Automatically detects and retries on deadlocks and snapshot isolation conflicts (Error 1020)
 *
 * @param fn Function to retry (should include full transaction logic)
 * @param options Retry configuration options
 * @returns Promise that resolves with the function result
 */
export async function retryTransientDatabaseErrors<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3, // Fewer attempts for database operations
    initialDelayMs = 100, // Start with shorter delay for database
    maxDelayMs = 5000, // Cap at 5 seconds for database
    backoffMultiplier = 2,
    onRetry
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry if it's a transient database error (deadlock or snapshot conflict)
      if (!isTransientDatabaseError(error)) {
        logger.debug("Non-transient error, not retrying", {
          error: lastError.message
        });
        throw lastError;
      }

      if (attempt === maxAttempts) {
        logger.error(
          `Database transaction retry exhausted after ${maxAttempts} attempts`,
          {
            error: lastError.message,
            errorType: isDatabaseError(error)
              ? (error as { errno?: number; code?: string }).code ||
                (error as { errno?: number }).errno ||
                "unknown"
              : "unknown"
          }
        );
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      logger.warn(
        `Transient database error on attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms...`,
        {
          error: lastError.message,
          errorType: isDatabaseError(error)
            ? (error as DatabaseError & { errno?: number; code?: string })
                .code ||
              (error as DatabaseError & { errno?: number }).errno ||
              "unknown"
            : "unknown",
          nextDelayMs: delay
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with max delay cap
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Database transaction retry failed");
}
