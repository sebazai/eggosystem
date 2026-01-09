import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";

export const setRoleForAccount = async (
  roleName: string,
  accountId: number,
  connection?: PoolConnection
) => {
  const [role] = await runQuery<{ role_id: number }[]>(
    `SELECT id as role_id FROM Roles WHERE role_name = ?`,
    [roleName],
    connection
  );
  if (!role) {
    throw new Error(`Unknown role ${roleName}`);
  }
  const roleId = role.role_id;
  await runQuery(
    `INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id) VALUES (?, ?, ?)`,
    [accountId, roleId, 1],
    connection
  );
};

export const removeRoleForAccount = async (
  roleName: string,
  accountId: number,
  connection?: PoolConnection
) => {
  const [role] = await runQuery<Array<{ role_id: number } | undefined>>(
    `SELECT id as role_id FROM Roles WHERE role_name = ?`,
    [roleName],
    connection
  );
  if (!role) {
    throw new Error(`Unknown role ${roleName}`);
  }
  const roleId = role.role_id;
  await runQuery(
    `DELETE FROM AccountRoles WHERE account_id = ? AND role_id = ? AND game_id = ?`,
    [accountId, roleId, 1],
    connection
  );
};

/**
 * Check if user has a specific role
 * Queries AccountRoles and Roles tables
 */
export const userHasRole = async (
  accountId: number,
  role: string,
  connection?: PoolConnection
): Promise<boolean> => {
  const existingRoles = await runQuery<{ role_id: number }[]>(
    `SELECT ar.role_id 
     FROM AccountRoles ar 
     JOIN Roles r ON ar.role_id = r.id 
     WHERE ar.account_id = ? AND r.role_name = ?`,
    [accountId, role],
    connection
  );

  return existingRoles && existingRoles.length > 0;
};

/**
 * Remove captain/co-captain status from a specific team
 * Returns whether the global captain role was retained for other teams
 */
export const removeCaptainFromTeam = async (
  steamId: string,
  accountId: number,
  role: "captain" | "co-captain",
  seasonId: number,
  teamId: number,
  connection?: PoolConnection
): Promise<{ roleRetained: boolean }> => {
  const field = role === "captain" ? "is_captain" : "is_co_captain";

  // Validate captain exists in SeasonTeamPlayers
  const existingCaptain = await runQuery<
    Array<{ steam_id: string; [key: string]: unknown }>
  >(
    `SELECT steam_id FROM SeasonTeamPlayers 
     WHERE season_id = ? AND team_id = ? AND steam_id = ? AND ${field} = 1`,
    [seasonId, teamId, steamId],
    connection
  );

  if (existingCaptain.length === 0) {
    throw new Error(
      `Player with Steam ID ${steamId} is not a ${role} for this team/season`
    );
  }

  // Remove captain flag from SeasonTeamPlayers
  await runQuery(
    `UPDATE SeasonTeamPlayers SET ${field} = 0 
     WHERE season_id = ? AND team_id = ? AND steam_id = ?`,
    [seasonId, teamId, steamId],
    connection
  );

  // Check if user still has captain status for other teams/seasons
  const otherCaptainAssignments = await runQuery<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM SeasonTeamPlayers
     WHERE steam_id = ? AND (is_captain = 1 OR is_co_captain = 1)`,
    [steamId],
    connection
  );

  const hasOtherCaptainAssignments =
    otherCaptainAssignments.length > 0 && otherCaptainAssignments[0].count > 0;

  // Note: Both captain and co-captain use the 'captain' role in AccountRoles
  if (!hasOtherCaptainAssignments) {
    await removeRoleForAccount("captain", accountId, connection);
  }

  return { roleRetained: hasOtherCaptainAssignments };
};
