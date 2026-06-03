import type {
  Account,
  UserPolicyAcceptance,
  UserPolicyAcceptancesPayload,
  NewsletterConsentType
} from "@eggosystem/types";

export type { NewsletterConsentType };
import semver from "semver";
import { runQuery } from "../db/mysqlRunQuery";
import * as crypto from "crypto";
import { type PoolConnection } from "mysql2/promise";
import { NotFoundError } from "../utils/errors";

const getUserPolicyAcceptances = async (accountId: Account["id"]) => {
  return await runQuery<UserPolicyAcceptance[] | undefined>(
    "SELECT * FROM UserPolicyAcceptances WHERE account_id = ?",
    [accountId]
  );
};

export const getLatestUserProfileNewsletterConsent = async (
  accountId: Account["id"]
) => {
  const result = await getUserPolicyAcceptances(accountId);

  if (!result || result.length === 0) {
    return true; // Default to true if no policies exist
  }

  const latestPolicy = getLatestPolicyBySemver(result);

  return latestPolicy
    ? (latestPolicy.accepted_tournament_newsletter ?? true)
    : true;
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
  const result = await getUserPolicyAcceptances(accountId);

  if (!result || result.length === 0) {
    return false;
  }

  const latestPolicy = getLatestPolicyBySemver(result);

  return !!latestPolicy?.accepted_marketing;
};

/**
 * Find the latest UserPolicyAcceptance record based on semver version comparison.
 * Uses semver coercion to handle versions like "1", "1.1", "1.0.0", etc.
 *
 * @param policies - Array of UserPolicyAcceptance records to search through
 * @returns The policy with the highest semver version, or null if no valid versions found
 */
export const getLatestPolicyBySemver = (
  policies: UserPolicyAcceptance[]
): UserPolicyAcceptance | null => {
  if (!policies || policies.length === 0) {
    return null;
  }

  let latestPolicy: UserPolicyAcceptance | null = null;
  let latestVersion: semver.SemVer | null = null;

  for (const policy of policies) {
    const version = semver.coerce(policy.privacy_policy_version);
    if (!version) continue; // Skip invalid semver versions

    if (!latestVersion || semver.gt(version, latestVersion)) {
      latestVersion = version;
      latestPolicy = policy;
    }
  }

  return latestPolicy;
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
  const result = await getUserPolicyAcceptances(accountId);

  if (!result || result.length === 0) {
    return false;
  }

  const latestPolicy = getLatestPolicyBySemver(result);

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

    // Use the shared getLatestPolicyBySemver utility
    const latestPolicy = getLatestPolicyBySemver(policies);

    consentMap.set(
      accountId,
      latestPolicy
        ? (latestPolicy.accepted_tournament_newsletter ?? false)
        : false
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

/**
 * Generate or retrieve an unsubscribe token for a user's policy acceptance record.
 * Uses the same semver logic as newsletter consent checking to determine the latest policy.
 * If a token already exists, returns the existing token.
 * Otherwise, generates a new secure random token and stores it.
 *
 * @param accountId - The account ID to generate/retrieve a token for
 * @param connection - Optional database connection for transaction support
 * @returns The unsubscribe token (existing or newly generated)
 */
export const getOrCreateUnsubscribeToken = async (
  accountId: Account["id"],
  connection?: PoolConnection
): Promise<string> => {
  // Get all policy acceptance records for the account
  const policies = await getUserPolicyAcceptances(accountId);

  if (!policies || policies.length === 0) {
    throw new NotFoundError("No policy acceptance found for account");
  }

  // Find the latest policy using semver logic (same as newsletter consent checking)
  const latestPolicy = getLatestPolicyBySemver(policies);

  if (!latestPolicy) {
    throw new NotFoundError("No valid policy version found for account");
  }

  if (latestPolicy.newsletter_unsubscribe_token) {
    return latestPolicy.newsletter_unsubscribe_token;
  }

  const token = crypto.randomBytes(32).toString("hex");

  await runQuery(
    `UPDATE UserPolicyAcceptances SET newsletter_unsubscribe_token = ? WHERE id = ?`,
    [token, latestPolicy.id],
    connection
  );

  return token;
};

/**
 * Find account by unsubscribe token and verify the token is valid.
 *
 * @param token - The unsubscribe token to look up
 * @param connection - Optional database connection
 * @returns The account ID if token is valid, null otherwise
 */
export const getAccountByUnsubscribeToken = async (
  token: string,
  connection?: PoolConnection
): Promise<Account["id"] | null> => {
  const policies = await runQuery<UserPolicyAcceptance[] | undefined>(
    `SELECT account_id FROM UserPolicyAcceptances WHERE newsletter_unsubscribe_token = ? LIMIT 1`,
    [token],
    connection
  );

  if (!policies || policies.length === 0) {
    return null;
  }

  return policies[0].account_id;
};

/**
 * Unsubscribe a user from newsletters by setting accepted_tournament_newsletter to false
 * for all their policy acceptance records.
 *
 * @param accountId - The account ID to unsubscribe
 * @param connection - Optional database connection for transaction support
 */
interface NewsletterEligiblePlayer {
  account_id: number;
  email: string;
  nickname: string;
  steam_id: string;
}

/**
 * Return all active SeasonTeamPlayers in a season whose latest-semver policy
 * record satisfies the requested consent type.
 */
export const getSeasonNewsletterEligiblePlayers = async (
  seasonId: number,
  consentType: NewsletterConsentType
): Promise<NewsletterEligiblePlayer[]> => {
  const rows = await runQuery<
    Array<{
      account_id: number;
      email: string;
      nickname: string;
      steam_id: string;
    }>
  >(
    `SELECT DISTINCT
       a.id AS account_id,
       a.work_email AS email,
       sp.nickname,
       sp.steam_id
     FROM SeasonTeamPlayers stp
     INNER JOIN SteamPlayers sp ON sp.steam_id = stp.steam_id
     INNER JOIN Accounts a ON a.id = sp.account_id
     WHERE stp.season_id = ?
       AND stp.discarded_at IS NULL
       AND a.work_email IS NOT NULL
       AND a.work_email_verified = 1`,
    [seasonId]
  );

  if (!rows || rows.length === 0) return [];

  const accountIds = rows.map((r) => r.account_id);
  const placeholders = accountIds.map(() => "?").join(",");
  const policies = await runQuery<UserPolicyAcceptance[] | undefined>(
    `SELECT * FROM UserPolicyAcceptances WHERE account_id IN (${placeholders})`,
    accountIds
  );

  const policiesByAccount = new Map<number, UserPolicyAcceptance[]>();
  for (const p of policies ?? []) {
    const existing = policiesByAccount.get(p.account_id) ?? [];
    existing.push(p);
    policiesByAccount.set(p.account_id, existing);
  }

  return rows.filter((row) => {
    const accountPolicies = policiesByAccount.get(row.account_id) ?? [];
    const latest = getLatestPolicyBySemver(accountPolicies);
    if (!latest) return false;
    if (consentType === "newsletter")
      return !!latest.accepted_tournament_newsletter;
    if (consentType === "marketing") return !!latest.accepted_marketing;
    return (
      !!latest.accepted_tournament_newsletter || !!latest.accepted_marketing
    );
  });
};

export const unsubscribeFromNewsletter = async (
  accountId: Account["id"],
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    `UPDATE UserPolicyAcceptances SET accepted_tournament_newsletter = 0 WHERE account_id = ?`,
    [accountId],
    connection
  );
};
