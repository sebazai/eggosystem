import type {
  UserPolicyAcceptancesPayload,
  UpdateUserProfile,
  UserPolicyAcceptance
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";

export const updateProfileData = async (
  steamId: string,
  updatedUser: UpdateUserProfile,
  connection?: PoolConnection
) => {
  return await runQuery(
    `UPDATE SteamPlayers SET nickname = ?, full_name = ?, work_email = ?, discord = ? WHERE steam_id = ?`,
    [
      updatedUser.nickname,
      updatedUser.full_name,
      updatedUser.work_email,
      updatedUser.discord,
      steamId
    ],
    connection
  );
};

export const userPolicyAcceptance = async (
  steamId: string,
  privacy_policy_version: string,
  connection: PoolConnection
) => {
  // Check if UserPolicyAcceptances already exists for privacy policy version
  const existingPolicyAcceptance = await runQuery<
    UserPolicyAcceptance[] | undefined
  >(
    `SELECT * FROM UserPolicyAcceptances WHERE steam_id = ? AND privacy_policy_version = ?`,
    [steamId, privacy_policy_version],
    connection
  );
  if (!existingPolicyAcceptance) {
    return null;
  }
  return existingPolicyAcceptance[0];
};

export const updateUserPolicyAcceptance = async (
  steamId: string,
  updatedData: UserPolicyAcceptancesPayload,
  connection: PoolConnection
) => {
  await runQuery(
    `UPDATE UserPolicyAcceptances SET accepted_privacy_policy = ?, accepted_marketing = ? WHERE steam_id = ? AND privacy_policy_version = ?`,
    [
      updatedData.accepted_privacy_policy,
      updatedData.accepted_marketing,
      steamId,
      updatedData.privacy_policy_version
    ],
    connection
  );
};

export const insertUserPolicyAcceptance = async (
  steamId: string,
  newUserPolicy: UserPolicyAcceptancesPayload,
  connection: PoolConnection
) => {
  // Update or insert UserPolicyAcceptance
  await runQuery(
    `INSERT INTO UserPolicyAcceptances (steam_id, accepted_privacy_policy, accepted_marketing, privacy_policy_version) VALUES (?, ?, ?, ?)`,
    [
      steamId,
      newUserPolicy.accepted_privacy_policy,
      newUserPolicy.accepted_marketing,
      newUserPolicy.privacy_policy_version
    ],
    connection
  );
};

export const getUserProfileAcceptanceForVersion = async (
  steamId: string,
  privacyPolicyVersion?: string
) => {
  if (!privacyPolicyVersion) {
    throw new Error("Missing PRIVACY_POLICY_VERSION in env");
  }
  const result = await runQuery<UserPolicyAcceptance[] | undefined>(
    "SELECT * FROM UserPolicyAcceptances WHERE steam_id = ? AND privacy_policy_version = ?",
    [steamId, privacyPolicyVersion]
  );

  if (!result) {
    return null;
  }
  return result[0];
};

export const getLatestUserProfileMarketingConsent = async (steamId: string) => {
  const result = await runQuery<UserPolicyAcceptance[] | undefined>(
    "SELECT * FROM UserPolicyAcceptances WHERE steam_id = ? ORDER BY created_at DESC",
    [steamId]
  );
  return !!result?.[0]?.accepted_marketing;
};
