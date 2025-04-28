import {
  type UserPolicyAcceptancesPayload,
  type AccountUpdateValues,
  type RequestWithBody,
  accountSchema,
  type UpdateUserProfile,
  type Account
} from "@eggosystem/types";
import * as uuid from "uuid";
import type { Response } from "express";
import z from "zod";
import { getConnection } from "../db/mysqlConnection";
import {
  insertUserPolicyAcceptance,
  updateAccountData,
  updateUserPolicyAcceptance,
  userPolicyAcceptance
} from "../models/account.models";
import { runQuery } from "../db/mysqlRunQuery";
import { expireInOneDay, redisClient } from "../utils/redisClient";

export const updateAccountProfile = async (
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

  const [existingAccount] = await runQuery<
    Array<
      | {
          email: Account["email"];
          work_email: Account["work_email"];
        }
      | undefined
    >
  >(`SELECT email, work_email FROM Accounts WHERE id = ?`, [accountId]);

  if (!existingAccount) {
    res.status(404).json({ message: "Account not found" });
    return;
  }

  const emailVerificationToken = uuid.v4();
  const workEmailVerificationToken = uuid.v4();

  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const updatedUser = {
    nickname: formData.nickname,
    full_name: formData.full_name,
    work_email: formData.work_email ?? null,
    work_email_token:
      formData.work_email && formData.work_email !== existingAccount.work_email
        ? workEmailVerificationToken
        : null,
    work_email_token_expires_at:
      formData.work_email && formData.work_email !== existingAccount.work_email
        ? oneDayLater
        : null,
    email: formData.email ?? null,
    email_token:
      formData.email && formData.email !== existingAccount.email
        ? emailVerificationToken
        : null,
    email_token_expires_at:
      formData.email && formData.email !== existingAccount.email
        ? oneDayLater
        : null,
    discord: formData.discord ?? null
  } satisfies UpdateUserProfile;

  const userPolicyAcceptancePayload = {
    accepted_privacy_policy: formData.acceptPrivacyPolicy,
    accepted_marketing: formData.acceptMarketing ?? false,
    privacy_policy_version: privacyPolicyVersion
  } satisfies UserPolicyAcceptancesPayload;

  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    // Update Player by steamId
    await updateAccountData(accountId, updatedUser, connection);

    const existingPolicyAcceptance = await userPolicyAcceptance(
      accountId,
      privacyPolicyVersion,
      connection
    );

    if (existingPolicyAcceptance) {
      // If it exists, update the existing record

      await updateUserPolicyAcceptance(
        accountId,
        userPolicyAcceptancePayload,
        connection
      );
      await connection.commit();
      if (formData.email && formData.email !== existingAccount.email) {
        await redisClient.set(
          `verify:email:${emailVerificationToken}`,
          JSON.stringify({
            accountId,
            email: formData.email
          }),
          "EX",
          expireInOneDay
        );

        // await sendVerificationEmail(formData.email, emailVerificationToken);
      }

      if (
        formData.work_email &&
        formData.work_email !== existingAccount.work_email
      ) {
        await redisClient.set(
          `verify:work_email:${workEmailVerificationToken}`,
          JSON.stringify({
            accountId,
            work_email: formData.work_email
          }),
          "EX",
          expireInOneDay
        );
      }
      res.status(200).json({
        message: "Profile updated successfully"
      });
      return;
    }

    await insertUserPolicyAcceptance(
      accountId,
      userPolicyAcceptancePayload,
      connection
    );
    if (formData.email && formData.email !== existingAccount.email) {
      await redisClient.set(
        `verify:email:${emailVerificationToken}`,
        JSON.stringify({
          accountId,
          email: formData.email
        }),
        "EX",
        expireInOneDay
      );

      // await sendVerificationEmail(formData.email, emailVerificationToken);
    }

    if (
      formData.work_email &&
      formData.work_email !== existingAccount.work_email
    ) {
      await redisClient.set(
        `verify:work_email:${workEmailVerificationToken}`,
        JSON.stringify({
          accountId,
          work_email: formData.work_email
        }),
        "EX",
        expireInOneDay
      );
    }
    await connection.commit();
    res.status(200).json({
      message: "Profile updated successfully"
    });
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
