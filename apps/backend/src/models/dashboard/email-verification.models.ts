import { runQuery } from "../../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import type { Nullable } from "@eggosystem/types";
import uuid from "uuid";
import { redisClient } from "../../utils/redisClient";
import { getSevenDaysLaterInMillis } from "../../utils/date-utils";

interface AccountLookupResult {
  account_id: number;
  steam_id: string;
  nickname: string;
  work_email: Nullable<string>;
  work_email_verified: boolean;
  work_email_token: Nullable<string>;
  work_email_token_expires_at: Nullable<string>;
}

type LookupType = "steam_id" | "account_id" | "nickname" | "email";

/**
 * Get account information by various lookup methods
 */
export const getAccountByLookup = async (
  lookupValue: string,
  lookupType: LookupType,
  connection?: PoolConnection
): Promise<AccountLookupResult | null> => {
  let query = "";
  let params: string[] = [];

  switch (lookupType) {
    case "steam_id":
      query = `
        SELECT 
          a.id as account_id,
          sp.steam_id,
          sp.nickname,
          a.work_email,
          a.work_email_verified,
          a.work_email_token,
          a.work_email_token_expires_at
        FROM SteamPlayers sp
        JOIN Accounts a ON sp.account_id = a.id
        WHERE sp.steam_id = ?
      `;
      params = [lookupValue];
      break;

    case "account_id":
      query = `
        SELECT 
          a.id as account_id,
          sp.steam_id,
          sp.nickname,
          a.work_email,
          a.work_email_verified,
          a.work_email_token,
          a.work_email_token_expires_at
        FROM Accounts a
        JOIN SteamPlayers sp ON a.id = sp.account_id
        WHERE a.id = ?
      `;
      params = [lookupValue];
      break;

    case "nickname":
      query = `
        SELECT 
          a.id as account_id,
          sp.steam_id,
          sp.nickname,
          a.work_email,
          a.work_email_verified,
          a.work_email_token,
          a.work_email_token_expires_at
        FROM SteamPlayers sp
        JOIN Accounts a ON sp.account_id = a.id
        WHERE sp.nickname = ?
      `;
      params = [lookupValue];
      break;

    case "email":
      query = `
        SELECT 
          a.id as account_id,
          sp.steam_id,
          sp.nickname,
          a.work_email,
          a.work_email_verified,
          a.work_email_token,
          a.work_email_token_expires_at
        FROM Accounts a
        JOIN SteamPlayers sp ON a.id = sp.account_id
        WHERE a.work_email = ?
      `;
      params = [lookupValue.toLowerCase()];
      break;

    default:
      throw new BadRequestError(`Invalid lookup type: ${lookupType}`);
  }

  const results = await runQuery<AccountLookupResult[]>(
    query,
    params,
    connection
  );

  return results.length > 0 ? results[0] : null;
};

/**
 * Get email verification status for an account
 */
export const getEmailVerificationStatus = async (
  accountId: number,
  connection?: PoolConnection
) => {
  const result = await getAccountByLookup(
    String(accountId),
    "account_id",
    connection
  );

  if (!result) {
    throw new NotFoundError("Account not found");
  }

  const isTokenValid =
    result.work_email_token &&
    result.work_email_token_expires_at &&
    new Date(result.work_email_token_expires_at) > new Date();

  const verificationUrl =
    result.work_email_token && isTokenValid
      ? `${process.env.FRONTEND_URL}/verify-email?token=${result.work_email_token}`
      : null;

  return {
    accountId: result.account_id,
    steamId: result.steam_id,
    nickname: result.nickname,
    workEmail: result.work_email,
    workEmailVerified: result.work_email_verified,
    workEmailToken: result.work_email_token,
    workEmailTokenExpiresAt: result.work_email_token_expires_at,
    isTokenValid: Boolean(isTokenValid),
    verificationUrl
  };
};

/**
 * Regenerate verification token for an account
 */
export const regenerateVerificationToken = async (
  accountId: number,
  connection?: PoolConnection
) => {
  // Get current account data
  const account = await getAccountByLookup(
    String(accountId),
    "account_id",
    connection
  );

  if (!account) {
    throw new NotFoundError("Account not found");
  }

  if (!account.work_email) {
    throw new BadRequestError("Account does not have a work email");
  }

  if (account.work_email_verified) {
    throw new BadRequestError("Account email is already verified");
  }

  // Delete old Redis token if it exists
  if (account.work_email_token) {
    await redisClient.del(`verify:work-email:${account.work_email_token}`);
  }

  // Generate new token
  const newToken = uuid.v4();
  const sevenDaysLaterInMillis = getSevenDaysLaterInMillis();
  const expiresAt = new Date(sevenDaysLaterInMillis);

  // Update database
  await runQuery(
    "UPDATE Accounts SET work_email_token = ?, work_email_token_expires_at = ? WHERE id = ?",
    [newToken, expiresAt, accountId],
    connection
  );

  // Store in Redis
  const redisKey = `verify:work-email:${newToken}`;
  const expireIn7Days = 60 * 60 * 24 * 7; // 7 days in seconds

  await redisClient.set(
    redisKey,
    JSON.stringify({
      accountId: account.account_id,
      email: account.work_email,
      expirationTime: sevenDaysLaterInMillis
    }),
    "EX",
    expireIn7Days
  );

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}`;

  return {
    success: true,
    token: newToken,
    expiresAt: expiresAt.toISOString(),
    verificationUrl
  };
};
