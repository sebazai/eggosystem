import { type Request, type Response, type NextFunction } from "express";
import { BaseError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import { ZodError } from "zod";

interface UnauthorizedErrorLike {
  name: string;
  status: number;
  message: string;
}

/**
 * Type guard to check if an error is an UnauthorizedError or similar
 */
function isUnauthorizedError(err: unknown): err is UnauthorizedErrorLike {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: string }).name === "UnauthorizedError" &&
    "status" in err &&
    "message" in err
  );
}

export const expressErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle UnauthorizedError (primarily from express-jwt)
  if (isUnauthorizedError(err)) {
    res.status(err.status || 401).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors;
    const errorMessages = errors.map((error) => error.message);
    res.status(400).json({ error: errorMessages.join(", ") });
    return;
  }

  if (err instanceof BaseError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof Error) {
    logger.error("Express Error Handler", err);
    res.status(400).json({ error: err.message });
    return;
  }

  logger.error(JSON.stringify(err));
  res.status(500).json({ error: "Something went wrong" });
};
