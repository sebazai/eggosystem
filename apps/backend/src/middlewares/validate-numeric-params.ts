import { type RequestHandler } from "express";
import { BadRequestError } from "../utils/errors";

/**
 * Middleware to validate that req.params (all or selected) are valid integers.
 * @param keys Optional array of specific param keys to validate. If omitted, all req.params are checked.
 */
export function validateNumericParams(keys?: string[]): RequestHandler {
  return (req, res, next) => {
    const paramKeys = keys ?? Object.keys(req.params);

    for (const key of paramKeys) {
      const value = req.params[key];
      const parsed = parseInt(value, 10);

      if (isNaN(parsed) || parsed < 0) {
        return next(new BadRequestError(`Invalid numeric param: ${key}`));
      }
    }

    next();
  };
}
