import type { AuthSteamUser } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type ResultSetHeader } from "mysql2/promise";
import { getConnection } from "../db/mysqlConnection";

/**
 * Use only in auth
 * @param steamId
 * @returns
 */
export const getAuthUserBySteamId = async (steamId: string) => {
  return await getAuthUserByProviderId(steamId, "steam");
};

/**
 * Get auth user by any provider ID
 * @param providerId
 * @param provider
 * @returns
 */
const getAuthUserByProviderId = async (
  providerId: string,
  provider: "steam" | "discord"
) => {
  const [user] = await runQuery<AuthSteamUser[]>(
    `SELECT 
      sp.nickname, 
      sp.steam_id, 
      a.id as account_id, 
      a.full_name, 
      a.work_email, 
      a.is_work_email_personal_email, 
      la.provider 
    FROM LinkedAccounts la 
      JOIN Accounts a ON la.account_id = a.id 
      JOIN SteamPlayers sp ON a.id = sp.account_id 
    WHERE la.provider_id = ? AND la.provider = ?`,
    [providerId, provider]
  );

  if (!user) {
    return null;
  }
  return user;
};

interface CreateUserParams {
  steamId: string;
  steamDisplayName: string;
  steamRealname?: string;
}

export const createAccountForSteam = async ({
  steamId,
  steamDisplayName,
  steamRealname
}: CreateUserParams) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const account = await runQuery<ResultSetHeader>(
      "INSERT INTO Accounts (full_name) VALUES (?)",
      [steamRealname ?? steamDisplayName],
      connection
    );
    await runQuery<ResultSetHeader>(
      `INSERT INTO SteamPlayers (steam_id, nickname, account_id) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         account_id = VALUES(account_id),
         nickname = VALUES(nickname)`,
      [steamId, steamDisplayName, account.insertId],
      connection
    );
    await runQuery<ResultSetHeader>(
      "INSERT INTO LinkedAccounts (account_id, provider_id, provider, provider_username) VALUES (?, ?, ?, ?)",
      [account.insertId, steamId, "steam", steamDisplayName],
      connection
    );
    await connection.commit();
    return { account_id: account.insertId, provider_id: steamId };
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update LinkedAccounts username for existing Steam user
 * @param steamId
 * @param steamDisplayName
 */
export const updateSteamLinkedAccountUsername = async (
  steamId: string,
  steamDisplayName: string
) => {
  await runQuery(
    `UPDATE LinkedAccounts 
       SET provider_username = ? 
       WHERE provider = 'steam' AND provider_id = ?`,
    [steamDisplayName, steamId]
  );
};
