import type {
  CasterApplication,
  CasterApplicationResponse
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { setRoleForAccount } from "./account-roles.models";

/**
 * Create a new caster application or re-apply (update rejected row to pending).
 * Fails if account already has a pending application for this organizer.
 */
export const createCasterApplication = async (
  organizerId: number,
  accountId: number,
  casterUrl: string,
  approvedTerms: boolean,
  connection?: PoolConnection
): Promise<CasterApplication> => {
  const conn = connection ?? (await getConnection());
  try {
    const existing = await runQuery<
      Array<{
        id: number;
        approved_at: string | null;
        rejected_at: string | null;
      }>
    >(
      `SELECT id, approved_at, rejected_at FROM CasterApplications
       WHERE account_id = ? AND organizer_id = ?`,
      [accountId, organizerId],
      conn
    );

    if (existing.length > 0) {
      const row = existing[0];
      if (row.approved_at !== null) {
        throw new Error("Application already approved");
      }
      if (row.rejected_at === null) {
        throw new Error("Application already pending");
      }
      // Re-apply: clear rejected fields, set new caster_url and terms
      await runQuery(
        `UPDATE CasterApplications
         SET caster_url = ?, approved_terms_and_conditions = ?,
             rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL,
             updated_at = NOW()
         WHERE id = ?`,
        [casterUrl, approvedTerms, row.id],
        conn
      );
      const [updated] = await runQuery<CasterApplication[]>(
        "SELECT * FROM CasterApplications WHERE id = ?",
        [row.id],
        conn
      );
      if (!updated) throw new Error("Failed to fetch updated application");
      return updated;
    }

    const insertResult = await runQuery<{ insertId: number }>(
      `INSERT INTO CasterApplications (organizer_id, account_id, caster_url, approved_terms_and_conditions)
       VALUES (?, ?, ?, ?)`,
      [organizerId, accountId, casterUrl, approvedTerms],
      conn
    );
    if (!insertResult?.insertId)
      throw new Error("Failed to insert application");
    const [created] = await runQuery<CasterApplication[]>(
      "SELECT * FROM CasterApplications WHERE id = ?",
      [insertResult.insertId],
      conn
    );
    if (!created) throw new Error("Failed to fetch created application");
    return created;
  } finally {
    if (!connection) conn.release();
  }
};

export const getCasterApplicationByAccountAndOrganizer = async (
  accountId: number,
  organizerId: number,
  connection?: PoolConnection
): Promise<CasterApplication | null> => {
  const [row] = await runQuery<CasterApplication[]>(
    "SELECT * FROM CasterApplications WHERE account_id = ? AND organizer_id = ?",
    [accountId, organizerId],
    connection
  );
  return row ?? null;
};

export const getCasterApplicationsByAccountId = async (
  accountId: number,
  connection?: PoolConnection
): Promise<CasterApplication[]> => {
  const rows = await runQuery<CasterApplication[]>(
    "SELECT * FROM CasterApplications WHERE account_id = ? ORDER BY organizer_id",
    [accountId],
    connection
  );
  return Array.isArray(rows) ? rows : [];
};

export const getAllCasterApplications = async (
  organizerId?: number,
  connection?: PoolConnection
): Promise<CasterApplicationResponse[]> => {
  const baseQuery = `
    SELECT ca.*, o.name AS organizer_name,
           la_discord.provider_username AS discord_username,
           la_steam.provider_id AS steam_id,
           sp.nickname
    FROM CasterApplications ca
    JOIN Organizers o ON o.id = ca.organizer_id
    JOIN Accounts a ON a.id = ca.account_id
    LEFT JOIN LinkedAccounts la_discord ON la_discord.account_id = ca.account_id AND la_discord.provider = 'discord' AND la_discord.provider_id IS NOT NULL AND la_discord.provider_id NOT LIKE 'fake_%'
    LEFT JOIN LinkedAccounts la_steam ON la_steam.account_id = ca.account_id AND la_steam.provider = 'steam'
    LEFT JOIN SteamPlayers sp ON sp.account_id = ca.account_id
    WHERE 1=1
  `;
  const params: (number | string)[] = [];
  if (organizerId !== undefined && organizerId !== null) {
    params.push(organizerId);
  }
  const whereClause =
    organizerId !== undefined && organizerId !== null
      ? " AND ca.organizer_id = ?"
      : "";
  const rows = await runQuery<CasterApplicationResponse[]>(
    baseQuery + whereClause + " ORDER BY ca.created_at DESC",
    params,
    connection
  );
  return Array.isArray(rows) ? rows : [];
};

export const approveCasterApplication = async (
  applicationId: number,
  approvedByAccountId: number,
  connection?: PoolConnection
): Promise<CasterApplication> => {
  const conn = connection ?? (await getConnection());
  try {
    const [app] = await runQuery<CasterApplication[]>(
      "SELECT * FROM CasterApplications WHERE id = ?",
      [applicationId],
      conn
    );
    if (!app) throw new Error("Application not found");
    if (app.approved_at !== null)
      throw new Error("Application already approved");
    if (app.rejected_at !== null)
      throw new Error("Cannot approve a rejected application");

    await conn.beginTransaction();
    try {
      await setRoleForAccount("caster", app.account_id, conn);
      await runQuery(
        `UPDATE CasterApplications SET approved_by = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [approvedByAccountId, applicationId],
        conn
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [updated] = await runQuery<CasterApplication[]>(
      "SELECT * FROM CasterApplications WHERE id = ?",
      [applicationId],
      conn
    );
    if (!updated) throw new Error("Failed to fetch updated application");
    return updated;
  } finally {
    if (!connection) conn.release();
  }
};

export const rejectCasterApplication = async (
  applicationId: number,
  rejectedByAccountId: number,
  rejectionReason: string,
  connection?: PoolConnection
): Promise<CasterApplication> => {
  const [app] = await runQuery<CasterApplication[]>(
    "SELECT * FROM CasterApplications WHERE id = ?",
    [applicationId],
    connection
  );
  if (!app) throw new Error("Application not found");
  if (app.approved_at !== null) throw new Error("Application already approved");

  await runQuery(
    `UPDATE CasterApplications
     SET rejected_by = ?, rejected_at = NOW(), rejection_reason = ?, updated_at = NOW()
     WHERE id = ?`,
    [rejectedByAccountId, rejectionReason, applicationId],
    connection
  );
  const [updated] = await runQuery<CasterApplication[]>(
    "SELECT * FROM CasterApplications WHERE id = ?",
    [applicationId],
    connection
  );
  if (!updated) throw new Error("Failed to fetch updated application");
  return updated;
};

export const getPendingApplicationsCount = async (
  organizerId?: number,
  connection?: PoolConnection
): Promise<number> => {
  let query =
    "SELECT COUNT(*) AS cnt FROM CasterApplications WHERE approved_at IS NULL AND rejected_at IS NULL";
  const params: number[] = [];
  if (organizerId !== undefined && organizerId !== null) {
    query += " AND organizer_id = ?";
    params.push(organizerId);
  }
  const [row] = await runQuery<Array<{ cnt: number }>>(
    query,
    params,
    connection
  );
  return row?.cnt ?? 0;
};

export const getOrganizersWithCasterApplications = async (
  connection?: PoolConnection
): Promise<
  Array<{
    id: number;
    name: string;
    discord_guild_id: string | null;
    discord_caster_channel_id: string | null;
  }>
> => {
  const rows = await runQuery<
    Array<{
      id: number;
      name: string;
      discord_guild_id: string | null;
      discord_caster_channel_id: string | null;
    }>
  >(
    `SELECT id, name, discord_guild_id, discord_caster_channel_id FROM Organizers WHERE discord_guild_id IS NOT NULL ORDER BY name`,
    [],
    connection
  );
  return Array.isArray(rows) ? rows : [];
};

export const getCasterApplicationById = async (
  applicationId: number,
  connection?: PoolConnection
): Promise<CasterApplication | null> => {
  const [row] = await runQuery<CasterApplication[]>(
    "SELECT * FROM CasterApplications WHERE id = ?",
    [applicationId],
    connection
  );
  return row ?? null;
};
