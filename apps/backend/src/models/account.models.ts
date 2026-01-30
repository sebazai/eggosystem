import type {
  UserPolicyAcceptancesPayload,
  UpdateUserProfile,
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
import {
  insertUserPolicyAcceptance,
  updateUserPolicyAcceptance,
  userPolicyAcceptance
} from "./user-policy-acceptance.models";

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
    accepted_tournament_newsletter: formData.acceptTournamentNewsletter ?? true,
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

/**
 * Updates SteamPlayers nickname and Accounts profile fields.
 * @public Exported for tests (jest.spyOn in account.controllers.test).
 */
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

/**
 * Check if the account has Steam linked (LinkedAccounts where provider = 'steam').
 */
export const hasSteamLinked = async (
  accountId: number,
  connection?: PoolConnection
): Promise<boolean> => {
  const [row] = await runQuery<Array<{ account_id: number }>>(
    "SELECT account_id FROM LinkedAccounts WHERE account_id = ? AND provider = 'steam' LIMIT 1",
    [accountId],
    connection
  );
  return Boolean(row);
};

/**
 * Get account_id and nickname from Steam ID
 * Queries LinkedAccounts and SteamPlayers tables
 */
export const getUserInfoBySteamId = async (
  steamId: string,
  connection?: PoolConnection
): Promise<{ account_id: number; nickname: string } | null> => {
  const users = await runQuery<Array<{ account_id: number; nickname: string }>>(
    `SELECT la.account_id, sp.nickname 
     FROM LinkedAccounts la 
     JOIN SteamPlayers sp ON la.account_id = sp.account_id 
     WHERE la.provider = 'steam' AND la.provider_id = ?`,
    [steamId],
    connection
  );

  return users && users.length > 0 ? users[0] : null;
};

/**
 * Get SteamPlayers nickname for an account (HUB nickname).
 * Returns null if account has no SteamPlayers row.
 */
export const getNicknameByAccountId = async (
  accountId: number,
  connection?: PoolConnection
): Promise<string | null> => {
  const [row] = await runQuery<Array<{ nickname: string }>>(
    "SELECT nickname FROM SteamPlayers WHERE account_id = ? LIMIT 1",
    [accountId],
    connection
  );
  return row?.nickname ?? null;
};
