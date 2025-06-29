import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

// Update organization Discord setup status
export const updateOrganizationDiscordSetup = async (
  organizationId: number,
  roleId: string | null,
  categoryId: string | null,
  setupCompleted: boolean,
  connection?: PoolConnection
) => {
  return await runQuery(
    `UPDATE Organizations 
     SET discord_role_id = ?, discord_category_id = ?, discord_setup_completed = ?
     WHERE id = ?`,
    [roleId, categoryId, setupCompleted, organizationId],
    connection
  );
};

// Update user's Discord user ID
export const updateUserDiscordId = async (
  accountId: number,
  discordUserId: string,
  connection?: PoolConnection
) => {
  return await runQuery(
    `UPDATE Accounts SET discord_user_id = ? WHERE id = ?`,
    [discordUserId, accountId],
    connection
  );
};

// Get user by Discord user ID
export const getUserByDiscordId = async (discordUserId: string) => {
  const result = await runQuery<
    Array<{
      id: number;
      steam_id: string;
      nickname: string;
      discord: string | null;
    }>
  >(
    `SELECT id, steam_id, nickname, discord FROM Accounts WHERE discord_user_id = ?`,
    [discordUserId]
  );
  return result[0];
};

// Get Discord user ID by account ID
export const getDiscordUserIdByAccountId = async (accountId: number) => {
  const result = await runQuery<
    Array<{
      discord_user_id: string | null;
    }>
  >(`SELECT discord_user_id FROM Accounts WHERE id = ?`, [accountId]);
  return result[0]?.discord_user_id || null;
};
