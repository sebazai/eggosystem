import type { AuthSteamUser } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";

/**
 * Use only in auth
 * @param steamId
 * @returns
 */
export const getAuthUserBySteamId = async (steamId: string) => {
  const [user] = await runQuery<AuthSteamUser[]>(
    `SELECT 
      sp.nickname, 
      sp.steam_id, 
      a.id as account_id, 
      a.full_name, 
      a.work_email, 
      a.discord,
      a.is_work_email_personal_email, 
      la.provider 
    FROM LinkedAccounts la 
      JOIN Accounts a ON la.account_id = a.id 
      JOIN SteamPlayers sp ON a.id = sp.account_id 
    WHERE la.provider_id = ? AND la.provider = 'steam'`,
    [steamId]
  );

  if (!user) {
    return null;
  }
  return user;
};

interface CreateUserParams {
  steamId: string;
  steamDisplayName: string;
  steamRealname: string;
}

export const createAccountForSteam = async ({
  steamId,
  steamDisplayName,
  steamRealname
}: CreateUserParams) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const account = await runQuery<{ insertId: number }>(
      "INSERT INTO Accounts (full_name) VALUES (?)",
      [steamRealname],
      connection
    );
    await runQuery<{ insertId: number }>(
      "INSERT INTO SteamPlayers (steam_id, nickname, account_id) VALUES (?, ?, ?)",
      [steamId, steamDisplayName, account.insertId],
      connection
    );
    await runQuery<{ insertId: number }>(
      "INSERT INTO LinkedAccounts (account_id, provider_id, provider) VALUES (?, ?, ?)",
      [account.insertId, steamId, "steam"],
      connection
    );
    return { account_id: account.insertId, provider_id: steamId };
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
