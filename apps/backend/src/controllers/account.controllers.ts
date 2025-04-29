import {
  type AccountUpdateValues,
  type RequestWithBody,
  accountSchema
} from "@eggosystem/types";
import type { Response } from "express";
import z from "zod";
import { updateAccount } from "../models/account.models";
import { redisClient } from "../utils/redisClient";
import { runQuery } from "../db/mysqlRunQuery";

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

interface RedisEmailVerificationToken {
  accountId: string;
  email: string;
  expirationTime: string;
}

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

  const redisEmailKey = `verify:email:${token}`;
  const redisWorkEmailKey = `verify:work_email:${token}`;

  const emailData = await redisClient.get(redisEmailKey);
  if (emailData) {
    const parsedData: RedisEmailVerificationToken = JSON.parse(emailData);
    if (new Date() > new Date(parsedData.expirationTime)) {
      res.status(400).json({ message: "Invalid or expired token." });
      return;
    }
    await runQuery(
      `UPDATE Accounts
      SET email_verified = true,
          email_token = NULL,
          email_token_expires_at = NULL
      WHERE id = ?`,
      [parsedData.accountId]
    );
    await redisClient.del(redisEmailKey);
    res.status(200).json({ message: "Email verified successfully" });
    return;
  }

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
    const [account] = await runQuery<Array<{ id: number } | undefined>>(
      `SELECT id FROM Accounts WHERE email_token = ? LIMIT 1`,
      [token]
    );

    if (account) {
      await runQuery(
        `
        UPDATE Accounts
        SET email_verified = true,
            email_token = NULL,
            email_token_expires_at = NULL
        WHERE id = ?
      `,
        [account.id]
      );
      res.status(200).json({ message: "Email verified successfully" });
      return;
    }

    const [workAccount] = await runQuery<Array<{ id: number } | undefined>>(
      `SELECT id FROM Accounts WHERE email_token = ? LIMIT 1`,
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
