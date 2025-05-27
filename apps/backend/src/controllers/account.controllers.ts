import {
  type Account,
  type AccountUpdateValues,
  type RequestWithBody,
  type RequestWithParams,
  accountSchema
} from "@eggosystem/types";
import * as uuid from "uuid";
import type { Response } from "express";
import z from "zod";
import { getAccountById, updateAccount } from "../models/account.models";
import { redisClient } from "../utils/redisClient";
import { runQuery } from "../db/mysqlRunQuery";
import { handleEmailVerification } from "../services/account.services";
import { getSevenDaysLaterInMillis } from "../utils/date-utils";

export const sendVerificationEmails = async (
  req: RequestWithParams<{ id: string }>,
  res: Response
) => {
  const accountId = Number(req.params.id);
  const user = req.auth;
  if (!user || user.account_id !== accountId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
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
  res: Response
) => {
  const accountId = Number(req.params.id);
  const user = req.auth;
  if (!user || user.account_id !== accountId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
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
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(data);
};

export const updateAccountProfileController = async (
  req: RequestWithBody<AccountUpdateValues>,
  res: Response
) => {
  const user = req.auth;
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
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
      res.status(400).json({
        message: "Invalid profile data",
        errors: error.flatten()
      });
      return;
    }
    throw error;
  }

  const result = await updateAccount(accountId, formData, privacyPolicyVersion);
  res.status(200).json(result);
};

interface RedisWorkEmailVerificationToken {
  accountId: string;
  work_email: string;
  expirationTime: string;
}

export const verifyEmailController = async (
  req: RequestWithBody<{ token: string }>,
  res: Response
) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ message: "No token provided" });
    return;
  }

  const redisWorkEmailKey = `verify:work-email:${token}`;

  const workEmailData = await redisClient.get(redisWorkEmailKey);
  if (workEmailData) {
    const parsedData: RedisWorkEmailVerificationToken =
      JSON.parse(workEmailData);
    if (new Date() > new Date(parsedData.expirationTime)) {
      res.status(400).json({ message: "Invalid or expired token." });
      return;
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

  try {
    const [workAccount] = await runQuery<Array<{ id: number } | undefined>>(
      `SELECT id FROM Accounts WHERE work_email_token = ? LIMIT 1`,
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

    res.status(400).json({ message: "Invalid or expired token." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
