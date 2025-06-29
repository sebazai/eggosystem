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
    if (existingLink.some((link) => link.account_id !== accountId)) {
      throw new Error("Discord account already linked to another account");
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
