import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "express-jwt";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (err instanceof UnauthorizedError) {
    res.status(err.status).json({ errors: [{ message: err.message }] });
    return;
  }

  res.status(500).json({ errors: [{ message: "Something went wrong" }] });
};
