import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection, type ResultSetHeader } from "mysql2/promise";
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

  // Check if this Discord user ID is already linked to a different account
  const existingLinkByDiscordId = await runQuery<{ account_id: number }[]>(
    `SELECT account_id FROM LinkedAccounts 
     WHERE provider = 'discord' AND provider_id = ?`,
    [discordUserId],
    connection
  );

  if (existingLinkByDiscordId.length > 0) {
    if (existingLinkByDiscordId.some((link) => link.account_id !== accountId)) {
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

  // Check if there's an existing fake row (provider_id starts with 'fake_') for this account
  const existingFakeLink = await runQuery<
    Array<{ account_id: number; provider_username: string | null }>
  >(
    `SELECT account_id, provider_username FROM LinkedAccounts 
     WHERE provider = 'discord' AND account_id = ? AND provider_id LIKE 'fake_%'`,
    [accountId],
    connection
  );

  if (existingFakeLink.length > 0) {
    // Can't UPDATE provider_id directly (it's part of primary key), so DELETE and INSERT
    // Preserve existing username if new one is not provided
    const usernameToUse =
      discordUsername || existingFakeLink[0].provider_username || null;

    // Delete the fake row
    await runQuery(
      `DELETE FROM LinkedAccounts 
       WHERE provider = 'discord' AND account_id = ? AND provider_id LIKE 'fake_%'`,
      [accountId],
      connection
    );

    // Insert the real OAuth link
    await runQuery(
      `INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username) 
       VALUES (?, 'discord', ?, ?)`,
      [accountId, discordUserId, usernameToUse],
      connection
    );

    logger.info(
      `Updated fake Discord link to real OAuth link for account ${accountId}: ${discordUserId}${usernameToUse ? ` (${usernameToUse})` : ""}`
    );
    return;
  }

  // Create new link
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
// Only returns provider_id if it's not NULL (i.e., valid OAuth-linked account)
export const getDiscordIdByAccountId = async (
  accountId: number,
  connection?: PoolConnection
) => {
  if (!accountId || accountId <= 0) {
    throw new Error("Invalid account ID provided");
  }

  const [discordLink] = await runQuery<{ provider_id: string }[]>(
    `SELECT provider_id FROM LinkedAccounts 
     WHERE provider = 'discord' AND account_id = ? AND provider_id IS NOT NULL AND provider_id NOT LIKE 'fake_%'`,
    [accountId],
    connection
  );

  return discordLink?.provider_id || null;
};

// Get Discord username by account ID
// Only returns username if provider_id is not NULL (i.e., valid OAuth-linked account)
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
     WHERE provider = 'discord' AND account_id = ? AND provider_id IS NOT NULL AND provider_id NOT LIKE 'fake_%'`,
    [accountId],
    connection
  );

  return discordLink?.provider_username || null;
};

// Get Discord ID and username by account ID
// Only returns info if provider_id is not NULL (i.e., valid OAuth-linked account)
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
     WHERE provider = 'discord' AND account_id = ? AND provider_id IS NOT NULL AND provider_id NOT LIKE 'fake_%'`,
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

// Unlink Discord account from user
// Only deletes real OAuth links (excludes fake links with provider_id LIKE 'fake_%')
export const unlinkDiscordAccount = async (
  accountId: number,
  connection?: PoolConnection
) => {
  if (!accountId || accountId <= 0) {
    throw new Error("Invalid account ID provided");
  }

  // Delete only real OAuth links (exclude fake links)
  const result = await runQuery<ResultSetHeader>(
    `DELETE FROM LinkedAccounts 
     WHERE provider = 'discord' 
     AND account_id = ? 
     AND provider_id IS NOT NULL 
     AND provider_id NOT LIKE 'fake_%'`,
    [accountId],
    connection
  );

  if (result.affectedRows > 0) {
    logger.info(
      `Successfully unlinked Discord account for account ${accountId}`
    );
  }

  return result.affectedRows > 0;
};
