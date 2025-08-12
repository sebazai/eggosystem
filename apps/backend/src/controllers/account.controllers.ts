import {
  type Account,
  type AccountUpdateValues,
  type RequestWithBody,
  type RequestWithParams,
  accountSchema
} from "@eggosystem/types";
import * as uuid from "uuid";
import type { Response, NextFunction } from "express";
import z from "zod";
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  InternalServerError
} from "../utils/errors";
import { getAccountById, updateAccount } from "../models/account.models";
import { redisClient } from "../utils/redisClient";
import { runQuery } from "../db/mysqlRunQuery";
import { handleEmailVerification } from "../services/account.services";
import { getSevenDaysLaterInMillis } from "../utils/date-utils";
import { logger } from "../utils/app-logger";

export const sendVerificationEmails = async (
  req: RequestWithParams<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  const accountId = Number(req.params.id);
  const user = req.auth;
  if (!user || user.account_id !== accountId) {
    return next(new UnauthorizedError("Unauthorized"));
  }

  const account = await getAccountById(accountId);
  const sevenDaysInMillis = getSevenDaysLaterInMillis();

  if (
    !account.work_email_verified &&
    account.work_email &&
    account.work_email_token &&
    account.work_email_token_expires_at
  ) {
    await redisClient.del(`verify:work-email:${account.work_email_token}`);
    const token = uuid.v4();
    await handleEmailVerification(
      accountId,
      account.work_email,
      "verify:work-email",
      token,
      sevenDaysInMillis
    );
    await runQuery(
      "UPDATE Accounts SET work_email_token = ?, work_email_token_expires_at = ? WHERE id = ?",
      [token, new Date(sevenDaysInMillis), account.id]
    );
  }

  res.json({ message: "New verification links sent" });
};

export const emailsVerifiedController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  const accountId = Number(req.params.id);
  const user = req.auth;
  if (!user || user.account_id !== accountId) {
    return next(new UnauthorizedError("Unauthorized"));
  }

  const [data] = await runQuery<
    Array<
      | Pick<Account, "work_email_verified" | "work_email_token_expires_at">
      | undefined
    >
  >(
    `SELECT work_email_verified, work_email_token_expires_at 
      FROM Accounts WHERE id = ?`,
    [accountId]
  );
  if (!data) {
    return next(new NotFoundError("User not found"));
  }
  res.json(data);
};

export const updateAccountProfileController = async (
  req: RequestWithBody<AccountUpdateValues>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth;
  if (!user) {
    return next(new UnauthorizedError("Unauthorized"));
  }
  const accountId = user.account_id;
  const formData = req.body;

  const privacyPolicyVersion = process.env.PRIVACY_POLICY_VERSION;
  if (!privacyPolicyVersion) {
    throw new Error("Privacy policy version is not set");
  }

  try {
    accountSchema.parse(formData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return next(new BadRequestError("Invalid profile data"));
    }
    throw error;
  }

  const result = await updateAccount(accountId, formData, privacyPolicyVersion);
  res.status(200).json(result);
};

interface RedisWorkEmailVerificationToken {
  accountId: number;
  email: string;
  expirationTime: string;
}

export const verifyEmailController = async (
  req: RequestWithBody<{ token: string }>,
  res: Response,
  next: NextFunction
) => {
  const { token } = req.body;
  if (!token) {
    return next(new BadRequestError("No token provided"));
  }

  const redisWorkEmailKey = `verify:work-email:${token}`;

  try {
    // JSON parsing and database operations can throw - legitimate error boundary
    const workEmailData = await redisClient.get(redisWorkEmailKey);
    if (workEmailData) {
      // JSON parsing - can throw for malformed data
      const parsedData: RedisWorkEmailVerificationToken =
        JSON.parse(workEmailData);

      // Validate Redis data structure
      if (!parsedData.accountId || !parsedData.expirationTime) {
        logger.error("Invalid Redis data structure", { parsedData });
        return next(new InternalServerError("Internal server error"));
      }

      if (new Date() > new Date(parsedData.expirationTime)) {
        return next(new BadRequestError("Invalid or expired token."));
      }

      await runQuery(
        `UPDATE Accounts
      SET work_email_verified = true,
          work_email_token = NULL,
          work_email_token_expires_at = NULL
      WHERE id = ?`,
        [parsedData.accountId]
      );
      await redisClient.del(redisWorkEmailKey);
      res.status(200).json({ message: "Email verified successfully" });
      return;
    }

    // Database fallback
    const [workAccount] = await runQuery<Array<{ id: number } | undefined>>(
      `SELECT id FROM Accounts 
       WHERE work_email_token = ? 
       AND work_email_token_expires_at > NOW() 
       LIMIT 1`,
      [token]
    );

    if (workAccount) {
      await runQuery(
        `
        UPDATE Accounts
        SET work_email_verified = true,
            work_email_token = NULL,
            work_email_token_expires_at = NULL
        WHERE id = ?
      `,
        [workAccount.id]
      );
      res.status(200).json({ message: "Email verified successfully" });
      return;
    }

    return next(new BadRequestError("Invalid or expired token."));
  } catch (error) {
    logger.error("Error verifying email", error);
    return next(new InternalServerError("Internal server error"));
  }
};
