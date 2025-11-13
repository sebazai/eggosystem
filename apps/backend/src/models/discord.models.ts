import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { logger } from "../utils/app-logger";

export const updateUserDiscordId = async (
  accountId: number,
  discordUserId: string,
  discordUsername?: string,
  connection?: PoolConnection
) => {
  await linkDiscordAccount(
    accountId,
    discordUserId,
    discordUsername,
    connection
  );
};

export const linkDiscordAccount = async (
  accountId: number,
  discordUserId: string,
  discordUsername?: string,
  connection?: PoolConnection
) => {
  if (!accountId || accountId <= 0) {
    throw new Error("Invalid account ID provided");
  }

  if (!discordUserId) {
    throw new Error("Invalid Discord user ID provided");
  }

  const existingLink = await runQuery<{ account_id: number }[]>(
    `SELECT account_id FROM LinkedAccounts 
     WHERE provider = 'discord' AND provider_id = ?`,
    [discordUserId],
    connection
  );

  if (existingLink.length > 0) {
    if (existingLink.some((link) => link.account_id !== accountId)) {
      logger.info(
        `Discord account ${discordUserId} already linked to account ${accountId}`
      );
      throw new Error("Discord account already linked to another account");
    }
    // Update username if provided and different
    if (discordUsername) {
      await runQuery(
        `UPDATE LinkedAccounts 
         SET provider_username = ? 
         WHERE provider = 'discord' AND provider_id = ? AND account_id = ?`,
        [discordUsername, discordUserId, accountId],
        connection
      );
    }
    return;
  }

  await runQuery(
    `INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username) 
     VALUES (?, 'discord', ?, ?)`,
    [accountId, discordUserId, discordUsername || null],
    connection
  );

  logger.info(
    `Successfully linked Discord account ${discordUserId}${discordUsername ? ` (${discordUsername})` : ""} to account ${accountId}`
  );
};

// Get Discord user ID by account ID
export const getDiscordIdByAccountId = async (
  accountId: number,
  connection?: PoolConnection
) => {
  if (!accountId || accountId <= 0) {
    throw new Error("Invalid account ID provided");
  }

  const [discordLink] = await runQuery<{ provider_id: string }[]>(
    `SELECT provider_id FROM LinkedAccounts 
     WHERE provider = 'discord' AND account_id = ?`,
    [accountId],
    connection
  );

  return discordLink?.provider_id || null;
};

// Get Discord username by account ID
export const getDiscordUsernameByAccountId = async (
  accountId: number,
  connection?: PoolConnection
) => {
  if (!accountId || accountId <= 0) {
    throw new Error("Invalid account ID provided");
  }

  const [discordLink] = await runQuery<
    Array<{ provider_username: string | null }>
  >(
    `SELECT provider_username FROM LinkedAccounts 
     WHERE provider = 'discord' AND account_id = ?`,
    [accountId],
    connection
  );

  return discordLink?.provider_username || null;
};

// Get Discord ID and username by account ID
export const getDiscordInfoByAccountId = async (
  accountId: number,
  connection?: PoolConnection
) => {
  if (!accountId || accountId <= 0) {
    throw new Error("Invalid account ID provided");
  }

  const [discordLink] = await runQuery<
    Array<{ provider_id: string; provider_username: string | null }>
  >(
    `SELECT provider_id, provider_username FROM LinkedAccounts 
     WHERE provider = 'discord' AND account_id = ?`,
    [accountId],
    connection
  );

  if (!discordLink) {
    return null;
  }

  return {
    discordId: discordLink.provider_id,
    discordUsername: discordLink.provider_username
  };
};
