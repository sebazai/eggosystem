import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { logger } from "../utils/app-logger";

export const updateUserDiscordId = async (
  accountId: number,
  discordUserId: string,
  connection?: PoolConnection
) => {
  await linkDiscordAccount(accountId, discordUserId, connection);
};

export const linkDiscordAccount = async (
  accountId: number,
  discordUserId: string,
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
  }

  // Create new Discord link
  await runQuery(
    `INSERT INTO LinkedAccounts (account_id, provider, provider_id) 
     VALUES (?, 'discord', ?)`,
    [accountId, discordUserId],
    connection
  );

  logger.info(
    `Successfully linked Discord account ${discordUserId} to account ${accountId}`
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
