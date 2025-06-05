import { type Request, type Response, type NextFunction } from "express";
import { UnauthorizedError } from "express-jwt";
import { BaseError } from "../utils/errors";
import { logger } from "../utils/app-logger";

export const expressErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof UnauthorizedError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  console.error("Express Error Handler:", err);
  logger.error("Express Error Handler:", err);

  if (err instanceof BaseError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  if (err instanceof Error) {
    res.status(400).json({ error: { message: err.message } });
    return;
  }

  res.status(500).json({ error: { message: "Something went wrong" } });
};
