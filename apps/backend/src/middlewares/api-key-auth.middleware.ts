import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../utils/app-logger";
import { UnauthorizedError } from "../utils/errors";

/**
 * Creates an API key authentication middleware with the provided API key
 * @param expectedApiKey - The API key to validate against
 * @returns Express middleware function
 */
export function createApiKeyValidator(expectedApiKey: string | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const providedKey = req.headers["x-api-key"];

    if (!providedKey) {
      logger.warn("API key missing from request");
      return next(new UnauthorizedError("API key required"));
    }

    if (Array.isArray(providedKey)) {
      return next(new UnauthorizedError("API key must be a string"));
    }

    if (!expectedApiKey || providedKey !== expectedApiKey) {
      logger.warn(`Invalid API key provided: ${providedKey.slice(0, 5)}...`);
      return next(new UnauthorizedError("Invalid API key"));
    }

    logger.info("API key validated successfully");
    next();
  };
}
