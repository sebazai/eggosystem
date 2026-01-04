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
import semver from "semver";
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
    `UPDATE UserPolicyAcceptances SET accepted_privacy_policy = ?, accepted_marketing = ?, accepted_tournament_newsletter = ? WHERE account_id = ? AND privacy_policy_version = ?`,
    [
      updatedData.accepted_privacy_policy,
      updatedData.accepted_marketing,
      updatedData.accepted_tournament_newsletter,
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
    `INSERT INTO UserPolicyAcceptances (account_id, accepted_privacy_policy, accepted_marketing, accepted_tournament_newsletter, privacy_policy_version) VALUES (?, ?, ?, ?, ?)`,
    [
      accountId,
      newUserPolicy.accepted_privacy_policy,
      newUserPolicy.accepted_marketing,
      newUserPolicy.accepted_tournament_newsletter,
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

export const getLatestUserProfileNewsletterConsent = async (
  accountId: Account["id"]
) => {
  const result = await runQuery<UserPolicyAcceptance[] | undefined>(
    "SELECT * FROM UserPolicyAcceptances WHERE account_id = ? ORDER BY created_at DESC",
    [accountId]
  );
  return result?.[0]?.accepted_tournament_newsletter ?? true;
};

/**
 * Get the latest newsletter consent by semver version comparison.
 * Finds the UserPolicyAcceptance with the highest semver privacy_policy_version
 * and returns its accepted_tournament_newsletter value.
 * @param accountId - Account ID to check
 * @returns true if latest semver version has accepted_tournament_newsletter = true, false otherwise
 */
export const getLatestNewsletterConsentBySemver = async (
  accountId: Account["id"]
): Promise<boolean> => {
  const result = await runQuery<UserPolicyAcceptance[] | undefined>(
    "SELECT * FROM UserPolicyAcceptances WHERE account_id = ?",
    [accountId]
  );

  if (!result || result.length === 0) {
    return false;
  }

  // Find the policy acceptance with the highest semver version
  let latestPolicy: UserPolicyAcceptance | null = null;
  let latestVersion: semver.SemVer | null = null;

  for (const policy of result) {
    const version = policy.privacy_policy_version;
    // Coerce version to semver format (e.g., "1" -> "1.0.0", "1.1" -> "1.1.0")
    const coercedVersion = semver.coerce(version);
    // Validate semver format
    if (coercedVersion && semver.valid(coercedVersion)) {
      if (!latestVersion || semver.gt(coercedVersion, latestVersion)) {
        latestVersion = coercedVersion;
        latestPolicy = policy;
      }
    }
  }

  // If no valid semver versions found, return false
  if (!latestPolicy) {
    return false;
  }

  return latestPolicy.accepted_tournament_newsletter ?? false;
};

/**
 * Batch version: Get the latest newsletter consent by semver version comparison for multiple accounts.
 * Finds the UserPolicyAcceptance with the highest semver privacy_policy_version for each account
 * and returns a map of account_id -> hasConsent.
 * @param accountIds - Array of Account IDs to check
 * @returns Map of account_id to boolean indicating if they have consent
 */
export const getLatestNewsletterConsentBySemverBatch = async (
  accountIds: Account["id"][]
): Promise<Map<Account["id"], boolean>> => {
  if (accountIds.length === 0) {
    return new Map();
  }

  const placeholders = accountIds.map(() => "?").join(",");
  const result = await runQuery<UserPolicyAcceptance[] | undefined>(
    `SELECT * FROM UserPolicyAcceptances WHERE account_id IN (${placeholders})`,
    accountIds
  );

  if (!result || result.length === 0) {
    // Return map with all false values
    return new Map(accountIds.map((id) => [id, false]));
  }

  // Group policies by account_id
  const policiesByAccount = new Map<Account["id"], UserPolicyAcceptance[]>();
  for (const policy of result) {
    const existing = policiesByAccount.get(policy.account_id) || [];
    existing.push(policy);
    policiesByAccount.set(policy.account_id, existing);
  }

  // For each account, find the latest semver version and check consent
  const consentMap = new Map<Account["id"], boolean>();
  for (const accountId of accountIds) {
    const policies = policiesByAccount.get(accountId) || [];

    if (policies.length === 0) {
      consentMap.set(accountId, false);
      continue;
    }

    // Find the policy acceptance with the highest semver version
    let latestPolicy: UserPolicyAcceptance | null = null;
    let latestVersion: semver.SemVer | null = null;

    for (const policy of policies) {
      const version = policy.privacy_policy_version;
      // Coerce version to semver format (e.g., "1" -> "1.0.0", "1.1" -> "1.1.0")
      const coercedVersion = semver.coerce(version);
      // Validate semver format
      if (coercedVersion && semver.valid(coercedVersion)) {
        if (!latestVersion || semver.gt(coercedVersion, latestVersion)) {
          latestVersion = coercedVersion;
          latestPolicy = policy;
        }
      }
    }

    // If no valid semver versions found, return false
    if (!latestPolicy) {
      consentMap.set(accountId, false);
      continue;
    }

    consentMap.set(
      accountId,
      latestPolicy.accepted_tournament_newsletter ?? false
    );
  }

  return consentMap;
};

export const hasAcceptedAnyPrivacyPolicy = async (accountId: Account["id"]) => {
  const result = await runQuery<Array<{ count: number }> | undefined>(
    "SELECT COUNT(*) as count FROM UserPolicyAcceptances WHERE account_id = ? AND accepted_privacy_policy = 1",
    [accountId]
  );
  return (result?.[0]?.count ?? 0) > 0;
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
