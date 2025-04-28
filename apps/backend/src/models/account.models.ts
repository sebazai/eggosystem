import type {
  UserPolicyAcceptancesPayload,
  UpdateUserProfile,
  UserPolicyAcceptance,
  Account,
  AccountUpdateValues
} from "@eggosystem/types";
import * as uuid from "uuid";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { NotFoundError } from "../utils/errors";
import { getConnection } from "../db/mysqlConnection";
import { expireInOneDay, redisClient } from "../utils/redisClient";

export const updateAccount = async (
  accountId: number,
  formData: AccountUpdateValues,
  privacyPolicyVersion: string
) => {
  const existingAccount = await getAccountById(accountId);

  const emailVerificationToken = uuid.v4();
  const workEmailVerificationToken = uuid.v4();

  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const hasWorkEmailChanged =
    formData.work_email && formData.work_email !== existingAccount.work_email;
  const hasEmailChanged =
    formData.email && formData.email !== existingAccount.email;

  const updatedUser = {
    nickname: formData.nickname,
    full_name: formData.full_name,
    work_email: formData.work_email ?? null,
    work_email_token: hasWorkEmailChanged ? workEmailVerificationToken : null,
    work_email_token_expires_at: hasWorkEmailChanged ? oneDayLater : null,
    email: formData.email ?? null,
    email_token: hasEmailChanged ? emailVerificationToken : null,
    email_token_expires_at: hasEmailChanged ? oneDayLater : null,
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

    if (hasEmailChanged) {
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

    if (hasWorkEmailChanged) {
      await redisClient.set(
        `verify:work_email:${workEmailVerificationToken}`,
        JSON.stringify({
          accountId,
          work_email: formData.work_email
        }),
        "EX",
        expireInOneDay
      );
      // await sendVerificationEmail(formData.work_email, workEmailVerificationToken);
    }

    const baseMsg = "Profile updated successfully.";
    const rememberJunk = "Remember to check junk folder as well.";
    if (hasWorkEmailChanged && hasEmailChanged) {
      return {
        message: `${baseMsg} Please verify both your emails. ${rememberJunk}`
      };
    }

    if (hasWorkEmailChanged) {
      return {
        message: `${baseMsg} Please verify your work email. ${rememberJunk}`
      };
    }

    if (hasEmailChanged) {
      return {
        message: `${baseMsg} Please verify your personal email. ${rememberJunk}`
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
  return runQuery(
    `UPDATE Accounts SET full_name = ?,  work_email = ?, work_email_token = ?, work_email_token_expires_at = ?, email = ?, email_token = ?, email_token_expires_at = ?, discord = ? WHERE id = ?`,
    [
      updatedUser.full_name,
      updatedUser.work_email,
      updatedUser.work_email_token,
      updatedUser.work_email_token_expires_at,
      updatedUser.email,
      updatedUser.email_token,
      updatedUser.email_token_expires_at,
      updatedUser.discord,
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
export const getAccountById = async (accountId: number) => {
  const [account] = await runQuery<Array<Account | undefined>>(
    "SELECT * FROM Accounts WHERE id = ?",
    [accountId]
  );
  if (!account) {
    throw new NotFoundError("Account not found");
  }
  return account;
};
