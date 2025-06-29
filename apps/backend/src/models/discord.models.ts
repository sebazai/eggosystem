import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

// Update user's Discord user ID (now only uses LinkedAccounts)
export const updateUserDiscordId = async (
  accountId: number,
  discordUserId: string,
  connection?: PoolConnection
) => {
  // Only ensure the Discord link exists in LinkedAccounts
  await linkDiscordAccount(accountId, discordUserId, connection);
};

// Link Discord account to existing account
export const linkDiscordAccount = async (
  accountId: number,
  discordUserId: string,
  connection?: PoolConnection
) => {
  // Check if Discord link already exists for this discordUserId
  const existingLink = await runQuery<{ account_id: number }[]>(
    `SELECT account_id FROM LinkedAccounts 
     WHERE provider = 'discord' AND provider_id = ?`,
    [discordUserId],
    connection
  );

  if (existingLink.length > 0) {
    // Update existing link to point to this account if needed
    if (existingLink[0].account_id !== accountId) {
      await runQuery(
        `UPDATE LinkedAccounts SET account_id = ? 
         WHERE provider = 'discord' AND provider_id = ?`,
        [accountId, discordUserId],
        connection
      );
    }
  } else {
    // Create new Discord link
    await runQuery(
      `INSERT INTO LinkedAccounts (account_id, provider, provider_id) 
       VALUES (?, 'discord', ?)`,
      [accountId, discordUserId],
      connection
    );
  }
};

// Get account by Discord user ID
export const getAccountByDiscordId = async (
  discordUserId: string,
  connection?: PoolConnection
) => {
  const [account] = await runQuery<{ account_id: number }[]>(
    `SELECT account_id FROM LinkedAccounts 
     WHERE provider = 'discord' AND provider_id = ?`,
    [discordUserId],
    connection
  );

  return account?.account_id || null;
};

// Get Discord user ID by account ID
export const getDiscordIdByAccountId = async (
  accountId: number,
  connection?: PoolConnection
) => {
  const [discordLink] = await runQuery<{ provider_id: string }[]>(
    `SELECT provider_id FROM LinkedAccounts 
     WHERE provider = 'discord' AND account_id = ?`,
    [accountId],
    connection
  );

  return discordLink?.provider_id || null;
};

// Unlink Discord account
export const unlinkDiscordAccount = async (
  accountId: number,
  connection?: PoolConnection
) => {
  // Remove from LinkedAccounts
  await runQuery(
    `DELETE FROM LinkedAccounts 
     WHERE provider = 'discord' AND account_id = ?`,
    [accountId],
    connection
  );
};
