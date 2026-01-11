import type { Request, Response, NextFunction } from "express";
import {
  getAccountByLookup,
  getEmailVerificationStatus,
  regenerateVerificationToken
} from "../../models/dashboard/email-verification.models";
import { BadRequestError } from "../../utils/errors";
import type {
  EmailVerificationLookupResult,
  EmailVerificationRegenerateResponse
} from "@eggosystem/types";

/**
 * Look up account by various methods and return verification status
 */
export const lookupAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lookup, lookupType } = req.query;

    // Validate inputs
    if (!lookup || typeof lookup !== "string") {
      return next(new BadRequestError("Lookup value is required"));
    }

    if (!lookupType || typeof lookupType !== "string") {
      return next(new BadRequestError("Lookup type is required"));
    }

    const validLookupTypes = ["steam_id", "account_id", "nickname", "email"];
    if (!validLookupTypes.includes(lookupType)) {
      return next(
        new BadRequestError(
          `Invalid lookup type. Must be one of: ${validLookupTypes.join(", ")}`
        )
      );
    }

    // Look up account
    const account = await getAccountByLookup(
      lookup,
      lookupType as "steam_id" | "account_id" | "nickname" | "email"
    );

    if (!account) {
      return next(new BadRequestError("Account not found"));
    }

    // Get verification status
    const status = await getEmailVerificationStatus(account.account_id);

    const response: EmailVerificationLookupResult = status;

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate verification token for an account
 */
export const regenerateTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountId } = req.body;

    // Validate input
    if (!accountId || typeof accountId !== "number") {
      return next(new BadRequestError("Account ID is required"));
    }

    // Regenerate token
    const result = await regenerateVerificationToken(accountId);

    const response: EmailVerificationRegenerateResponse = result;

    res.json(response);
  } catch (error) {
    next(error);
  }
};
