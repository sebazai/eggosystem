import { type Request, type Response, type NextFunction } from "express";
import { UnauthorizedError } from "express-jwt";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof UnauthorizedError) {
    res.status(err.status).json({ errors: [{ message: err.message }] });
    return;
  }

  console.error("Express Error Handler:", err);

  if (err instanceof Error) {
    res.status(400).json({ errors: [{ message: err.message }] });
    return;
  }

  res.status(500).json({ errors: [{ message: "Something went wrong" }] });
};
