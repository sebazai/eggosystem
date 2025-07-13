import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../utils/app-logger";

/**
 * API key authentication middleware
 * Validates API key from the X-API-KEY header against environment variable BACKEND_SERVICE_API_KEY
 */
export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
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

  const apiKey = process.env.BACKEND_SERVICE_API_KEY;

  if (!apiKey || providedKey !== apiKey) {
    logger.warn(`Invalid API key provided: ${providedKey.slice(0, 5)}...`);
    res.status(401).json({
      error: { message: "Invalid API key" }
    });
    return;
  }

  logger.info("API key validated successfully");
  next();
}
