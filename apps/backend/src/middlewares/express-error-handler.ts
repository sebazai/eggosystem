import { type Request, type Response, type NextFunction } from "express";
import { BaseError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import { ZodError } from "zod";
import { convertDatabaseErrorToConflictError } from "../utils/database-errors";

interface UnauthorizedErrorLike {
  name: string;
  status: number;
  message: string;
}

function statusToTitle(status: number): string {
  const map: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable"
  };
  return map[status] ?? "Error";
}

function buildProblem(
  status: number,
  detail: string,
  instance: string,
  titleOverride?: string,
  extensions?: Record<string, unknown>
) {
  return {
    type: "about:blank",
    title: titleOverride ?? statusToTitle(status),
    status,
    detail,
    instance,
    ...(extensions ?? {})
  };
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
    const status = err.status || 401;
    const problem = buildProblem(status, err.message, req.originalUrl);
    res.status(status).type("application/problem+json").json(problem);
    return;
  }

  if (err instanceof ZodError) {
    logger.error("ZodError", err);
    const status = 400;
    const detail = err.issues?.map((i) => i.message).join(", ") || err.message;
    const problem = buildProblem(status, detail, req.originalUrl, undefined, {
      issues: err.issues ?? []
    });
    res.status(status).type("application/problem+json").json(problem);
    return;
  }

  if (err instanceof BaseError) {
    const status = err.status;
    const problem = buildProblem(
      status,
      err.message,
      req.originalUrl,
      err.title
    );
    res.status(status).type("application/problem+json").json(problem);
    return;
  }

  if (err instanceof Error) {
    logger.error("Express Error Handler", err);

    // CORS errors should return 500 as they represent server policy rejection
    if (err.message.includes("Not allowed by CORS")) {
      const problem = buildProblem(500, err.message, req.originalUrl);
      res.status(500).type("application/problem+json").json(problem);
      return;
    }

    // Check for database duplicate entry or trigger errors
    const conflictError = convertDatabaseErrorToConflictError(err);
    if (conflictError) {
      const problem = buildProblem(
        conflictError.status,
        conflictError.message,
        req.originalUrl,
        conflictError.title
      );
      res
        .status(conflictError.status)
        .type("application/problem+json")
        .json(problem);
      return;
    }

    // Check if the error has a status property
    const status = (err as Error & { status?: number }).status || 400;
    const problem = buildProblem(status, err.message, req.originalUrl);
    res.status(status).type("application/problem+json").json(problem);
    return;
  }

  // Check for database errors even if not an Error instance (unlikely but possible)
  const conflictError = convertDatabaseErrorToConflictError(err);
  if (conflictError) {
    const problem = buildProblem(
      conflictError.status,
      conflictError.message,
      req.originalUrl,
      conflictError.title
    );
    res
      .status(conflictError.status)
      .type("application/problem+json")
      .json(problem);
    return;
  }

  logger.error(JSON.stringify(err));
  const problem = buildProblem(500, "Something went wrong", req.originalUrl);
  res.status(500).type("application/problem+json").json(problem);
};
