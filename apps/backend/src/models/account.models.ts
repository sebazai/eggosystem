import type {
  UserPolicyAcceptancesPayload,
  UpdateUserProfile,
  UserPolicyAcceptance,
  Account
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";

export const updateAccountData = async (
  accountId: Account["id"],
  updatedUser: UpdateUserProfile,
  connection?: PoolConnection
) => {
  await runQuery(
    "Update SteamPlayers SET nickname = ? WHERE account_id = ?",
    [updatedUser.nickname, accountId],
    connection
  );
  return runQuery(
    `UPDATE Accounts SET full_name = ?, work_email = ?, discord = ? WHERE id = ?`,
    [
      updatedUser.full_name,
      updatedUser.work_email,
      updatedUser.discord,
      accountId
    ],
    connection
  );
};

export const updateAccountDiscord = async (
  accountId: Account["id"],
  discord: string
) => {
  return runQuery("UPDATE Accounts set discord = ? WHERE id = ?", [
    discord,
    accountId
  ]);
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
