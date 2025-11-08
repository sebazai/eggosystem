import type {
  UserPolicyAcceptancesPayload,
  UpdateUserProfile,
  UserPolicyAcceptance,
  Account,
  AccountUpdateValues,
  Reservation
} from "@eggosystem/types";
import * as uuid from "uuid";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { NotFoundError } from "../utils/errors";
import { getConnection } from "../db/mysqlConnection";
import { handleEmailVerification } from "../services/account.services";
import { getSevenDaysLaterInMillis } from "../utils/date-utils";
import { logger } from "../utils/app-logger";
import { redisClient } from "../utils/redisClient";

export const updateAccount = async (
  accountId: number,
  formData: AccountUpdateValues,
  privacyPolicyVersion: string
) => {
  const existingAccount = await getAccountById(accountId);

  const workEmailVerificationToken = uuid.v4();

  const sevenDaysLaterInMillis = getSevenDaysLaterInMillis();

  const hasWorkEmailChanged =
    formData.work_email && formData.work_email !== existingAccount.work_email;

  // Clean up old verification token from Redis if email changed
  if (hasWorkEmailChanged && existingAccount.work_email_token) {
    await redisClient.del(
      `verify:work-email:${existingAccount.work_email_token}`
    );
  }

  const updatedUser = {
    nickname: formData.nickname,
    full_name: formData.full_name,
    work_email: formData.work_email.toLowerCase(),
    work_email_token: hasWorkEmailChanged
      ? workEmailVerificationToken
      : existingAccount.work_email_token,
    work_email_token_expires_at: hasWorkEmailChanged
      ? new Date(sevenDaysLaterInMillis)
      : existingAccount.work_email_token_expires_at
        ? new Date(existingAccount.work_email_token_expires_at)
        : null,
    work_email_verified: hasWorkEmailChanged
      ? false
      : existingAccount.work_email_verified,
    is_work_email_personal_email: formData.isPersonalEmail || false
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
      await updateUserPolicyAcceptance(
        accountId,
        userPolicyAcceptancePayload,
        connection
      );
    } else {
      await insertUserPolicyAcceptance(
        accountId,
        userPolicyAcceptancePayload,
        connection
      );
    }

    await connection.commit();

    if (hasWorkEmailChanged && formData.work_email) {
      handleEmailVerification(
        accountId,
        formData.work_email,
        workEmailVerificationToken,
        sevenDaysLaterInMillis
      ).catch((err) => {
        logger.error("Failed to send verification email:", err);
      });
    }

    if (hasWorkEmailChanged) {
      return {
        message:
          "Profile updated successfully. Please verify your email. Remember to check junk folder as well."
      };
    }

    return {
      message: "Profile updated successfully."
    };
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateAccountData = async (
  accountId: Account["id"],
  updatedUser: UpdateUserProfile,
  connection?: PoolConnection
) => {
  await runQuery(
    "UPDATE SteamPlayers SET nickname = ? WHERE account_id = ?",
    [updatedUser.nickname, accountId],
    connection
  );
  return await runQuery(
    `UPDATE Accounts 
      SET 
        full_name = ?,  
        work_email = ?, 
        work_email_token = ?, 
        work_email_token_expires_at = ?, 
        work_email_verified = ?,
        is_work_email_personal_email = ?
      WHERE id = ?`,
    [
      updatedUser.full_name,
      updatedUser.work_email,
      updatedUser.work_email_token,
      updatedUser.work_email_token_expires_at,
      updatedUser.work_email_verified,
      updatedUser.is_work_email_personal_email,
      accountId
    ],
    connection
  );
};

export const userPolicyAcceptance = async (
  accountId: Account["id"],
  privacy_policy_version: string,
  connection: PoolConnection
) => {
  // Check if UserPolicyAcceptances already exists for privacy policy version
  const existingPolicyAcceptance = await runQuery<
    UserPolicyAcceptance[] | undefined
  >(
    `SELECT * FROM UserPolicyAcceptances WHERE account_id = ? AND privacy_policy_version = ?`,
    [accountId, privacy_policy_version],
    connection
  );
  if (!existingPolicyAcceptance) {
    return null;
  }
  return existingPolicyAcceptance[0];
};

export const updateUserPolicyAcceptance = async (
  accountId: Account["id"],
  updatedData: UserPolicyAcceptancesPayload,
  connection: PoolConnection
) => {
  await runQuery(
    `UPDATE UserPolicyAcceptances SET accepted_privacy_policy = ?, accepted_marketing = ? WHERE account_id = ? AND privacy_policy_version = ?`,
    [
      updatedData.accepted_privacy_policy,
      updatedData.accepted_marketing,
      accountId,
      updatedData.privacy_policy_version
    ],
    connection
  );
};

export const insertUserPolicyAcceptance = async (
  accountId: Account["id"],
  newUserPolicy: UserPolicyAcceptancesPayload,
  connection: PoolConnection
) => {
  // Update or insert UserPolicyAcceptance
  await runQuery(
    `INSERT INTO UserPolicyAcceptances (account_id, accepted_privacy_policy, accepted_marketing, privacy_policy_version) VALUES (?, ?, ?, ?)`,
    [
      accountId,
      newUserPolicy.accepted_privacy_policy,
      newUserPolicy.accepted_marketing,
      newUserPolicy.privacy_policy_version
    ],
    connection
  );
};

export const getUserProfileAcceptanceForVersion = async (
  accountId: Account["id"],
  privacyPolicyVersion?: string
) => {
  if (!privacyPolicyVersion) {
    throw new Error("Missing PRIVACY_POLICY_VERSION in env");
  }
  const result = await runQuery<UserPolicyAcceptance[] | undefined>(
    "SELECT * FROM UserPolicyAcceptances WHERE account_id = ? AND privacy_policy_version = ?",
    [accountId, privacyPolicyVersion]
  );

  if (!result) {
    return null;
  }
  return result[0];
};

export const getLatestUserProfileMarketingConsent = async (
  accountId: Account["id"]
) => {
  const result = await runQuery<UserPolicyAcceptance[] | undefined>(
    "SELECT * FROM UserPolicyAcceptances WHERE account_id = ? ORDER BY created_at DESC",
    [accountId]
  );
  return !!result?.[0]?.accepted_marketing;
};

export const getAccountIdBySteamId = async (
  steamId: string,
  connection?: PoolConnection
) => {
  const [result] = await runQuery<{ account_id: number }[]>(
    `SELECT id as account_id FROM Accounts a JOIN SteamPlayers sp ON a.id = sp.account_id WHERE sp.steam_id = ?`,
    [steamId],
    connection
  );
  if (!result) {
    throw new Error(`Could not find account id for steam id ${steamId}`);
  }
  return result;
};

/**
 * Never use in frontend.
 * @param accountId
 * @returns
 */
export const getAccountById = async (
  accountId: number,
  connection?: PoolConnection
) => {
  const [account] = await runQuery<Array<Account | undefined>>(
    "SELECT * FROM Accounts WHERE id = ?",
    [accountId],
    connection
  );
  if (!account) {
    throw new NotFoundError("Account not found");
  }
  return account;
};

export const getAccountMatchReservations = async (
  accountId: number,
  matchId: number
) => {
  const [result] = await runQuery<Array<Reservation | undefined>>(
    "SELECT * FROM Reservations WHERE account_id = ? AND match_id = ?",
    [accountId, matchId]
  );
  return result;
};
