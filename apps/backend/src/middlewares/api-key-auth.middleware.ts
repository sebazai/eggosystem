import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../utils/app-logger";

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
      res.status(401).json({
        error: { message: "API key required" }
      });
      return;
    }

    if (Array.isArray(providedKey)) {
      res.status(401).json({
        error: { message: "API key must be a string" }
      });
      return;
    }

    console.log("expectedApiKey", expectedApiKey);
    console.log("providedKey", providedKey);
    if (!expectedApiKey || providedKey !== expectedApiKey) {
      logger.warn(`Invalid API key provided: ${providedKey.slice(0, 5)}...`);
      res.status(401).json({
        error: { message: "Invalid API key" }
      });
      return;
    }

    logger.info("API key validated successfully");
    next();
  };
}
