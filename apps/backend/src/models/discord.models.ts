import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

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
