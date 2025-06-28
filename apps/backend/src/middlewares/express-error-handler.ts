import { type Request, type Response, type NextFunction } from "express";
import { UnauthorizedError } from "express-jwt";
import { BaseError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import { ZodError } from "zod";

export const expressErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (
    (typeof UnauthorizedError !== "undefined" &&
      err instanceof UnauthorizedError) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err && (err as any).name === "UnauthorizedError")
  ) {
    res
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .status((err as any).status || 401)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .json({ error: (err as any).message });
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
