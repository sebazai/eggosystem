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
import {
  getAccountById,
  getAccountMatchReservations,
  updateAccount
} from "../models/account.models";
import {
  getAccountByUnsubscribeToken,
  unsubscribeFromNewsletter
} from "../models/user-policy-acceptance.models";
import { redisClient } from "../utils/redisClient";
import { runQuery } from "../db/mysqlRunQuery";
import { handleEmailVerification } from "../services/account.services";
import { getSevenDaysLaterInMillis } from "../utils/date-utils";
import { logger } from "../utils/app-logger";
import { getConnection } from "../db/mysqlConnection";

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

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const account = await getAccountById(accountId, connection);
    const sevenDaysInMillis = getSevenDaysLaterInMillis();
    if (account.work_email_verified) {
      throw new BadRequestError("Account already verified");
    }

    if (!account.work_email) {
      throw new BadRequestError("Work email not found");
    }

    await redisClient.del(`verify:work-email:${account.work_email_token}`);
    const token = uuid.v4();
    await runQuery(
      "UPDATE Accounts SET work_email_token = ?, work_email_token_expires_at = ? WHERE id = ?",
      [token, new Date(sevenDaysInMillis), account.id],
      connection
    );

    await handleEmailVerification(
      accountId,
      account.work_email,
      token,
      sevenDaysInMillis
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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

  const workEmailData = await redisClient.get(redisWorkEmailKey);
  if (workEmailData) {
    // Consume the token from Redis even if it fails to verify
    await redisClient.del(redisWorkEmailKey);
    const parsedData: RedisWorkEmailVerificationToken =
      JSON.parse(workEmailData);

    if (!parsedData.accountId || !parsedData.expirationTime) {
      logger.error("Invalid Redis data structure", { parsedData });
      return next(new InternalServerError("Internal server error"));
    }

    if (new Date() > new Date(parsedData.expirationTime)) {
      return next(new BadRequestError("Invalid or expired token."));
    }

    // Verify that the token's email matches the current work_email
    const updateResult = await runQuery<{ affectedRows: number }>(
      `UPDATE Accounts
        SET work_email_verified = true,
        work_email_token_expires_at = NULL
      WHERE id = ? AND work_email = ?`,
      [parsedData.accountId, parsedData.email]
    );

    if (updateResult.affectedRows === 0) {
      return next(new BadRequestError("Invalid or expired token."));
    }
    res.status(200).json({ message: "Email verified successfully" });
    return;
  }

  const [row] = await runQuery<
    Array<{ id: number; work_email_verified: boolean } | undefined>
  >(
    `SELECT id, work_email_verified FROM Accounts 
      WHERE work_email_token = ?`,
    [token]
  );

  if (row) {
    if (row.work_email_verified) {
      res.status(200).json({ message: "Email verified successfully" });
      return;
    }

    const updateResult = await runQuery<{ affectedRows: number }>(
      `UPDATE Accounts
        SET work_email_verified = true,
        work_email_token_expires_at = NULL
      WHERE id = ? AND work_email_token_expires_at > NOW()`,
      [row.id]
    );

    if (updateResult.affectedRows === 1) {
      res.status(200).json({ message: "Email verified successfully" });
      return;
    }
  }

  logger.error("Invalid or expired token.", { token });

  return next(new BadRequestError("Invalid or expired token."));
};

export const getAccountMatchReservationsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth;
  const accountId = user?.account_id;
  if (!accountId) {
    return next(new UnauthorizedError("Could not get account id"));
  }
  const matchId = Number(req.params.match_id);
  const reservation = await getAccountMatchReservations(accountId, matchId);
  res.json(reservation ?? null);
};

/**
 * Unsubscribe from newsletters using a token.
 * This is a public endpoint that doesn't require authentication.
 *
 * Supports both:
 * - GET: From frontend unsubscribe page (shows confirmation UI)
 * - POST: One-click unsubscribe from email clients (RFC 8058) - no confirmation needed
 */
export const unsubscribeNewsletterController = async (
  req: RequestWithParams<{ token: string }>,
  res: Response,
  next: NextFunction
) => {
  const token = req.params.token;

  if (!token) {
    return next(new BadRequestError("Missing unsubscribe token"));
  }

  try {
    const accountId = await getAccountByUnsubscribeToken(token);

    if (!accountId) {
      return next(new NotFoundError("Invalid or expired unsubscribe token"));
    }

    await unsubscribeFromNewsletter(accountId);

    // For POST requests (one-click from email clients), return simple success
    // For GET requests (from frontend), return JSON that frontend can display
    if (req.method === "POST") {
      // RFC 8058: One-click unsubscribe should return 200 OK
      // Email clients expect a simple success response
      res.status(200).json({
        message: "You have been successfully unsubscribed from newsletters"
      });
    } else {
      // GET request from frontend - return JSON for frontend to display
      res.status(200).json({
        message: "You have been successfully unsubscribed from newsletters"
      });
    }
  } catch (error) {
    logger.error("Error unsubscribing from newsletter:", error);
    return next(
      new InternalServerError("Failed to process unsubscribe request")
    );
  }
};
