import { type Request, type Response, type NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";
import { logger } from "../utils/app-logger";

/**
 * API key authentication middleware
 * Validates API key from the X-API-KEY header against environment variable PARSER_API_KEY
 */
export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get API key from header
    const providedKey = req.headers["x-api-key"] as string;

    // If no key provided
    if (!providedKey) {
      logger.warn("API key missing from request");
      throw new UnauthorizedError("API key required");
    }

    // Get allowed key from environment variable
    const apiKey = process.env.PARSER_API_KEY;

    // Check if API key is valid
    if (!apiKey || providedKey !== apiKey) {
      logger.warn(`Invalid API key provided: ${providedKey.slice(0, 5)}...`);
      throw new UnauthorizedError("Invalid API key");
    }

    // Key is valid, proceed
    logger.info("API key validated successfully");
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: { message: error.message } });
    } else {
      logger.error("API key validation error", error);
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
}
