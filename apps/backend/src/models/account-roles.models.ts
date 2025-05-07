import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { flushPermissionsAndRolesForAccountId } from "../services/auth.services";

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
  await flushPermissionsAndRolesForAccountId(accountId);
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
  await flushPermissionsAndRolesForAccountId(accountId);
  await runQuery(
    `DELETE FROM AccountRoles WHERE account_id = ? AND role_id = ? AND game_id = ?`,
    [accountId, roleId, 1],
    connection
  );
};

export const setScopedPermissionForAccount = async (
  permissionName: string,
  accountId: number,
  seasonId: number,
  teamId: number,
  connection?: PoolConnection
) => {
  const [permission] = await runQuery<
    Array<{ permission_id: number } | undefined>
  >(
    `SELECT id as permission_id FROM Permissions WHERE permission_name = ?`,
    [permissionName],
    connection
  );
  if (!permission) {
    throw new Error(`Unknown permission ${permissionName}`);
  }
  const permissionId = permission.permission_id;
  await flushPermissionsAndRolesForAccountId(accountId);
  await runQuery(
    `INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id) VALUES (?, ?, ?, ?)`,
    [accountId, permissionId, seasonId, teamId],
    connection
  );
};

export const removeScopedPermissionForAccount = async (
  permissionName: string,
  accountId: number,
  seasonId: number,
  teamId: number,
  connection?: PoolConnection
) => {
  const [permission] = await runQuery<
    Array<{ permission_id: number } | undefined>
  >(
    `SELECT id as permission_id FROM Permissions WHERE permission_name = ?`,
    [permissionName],
    connection
  );
  if (!permission) {
    throw new Error(`Unknown permission ${permissionName}`);
  }
  const permissionId = permission.permission_id;
  await flushPermissionsAndRolesForAccountId(accountId);
  await runQuery(
    `DELETE FROM AccountPermissionScopes WHERE account_id = ? AND permission_id = ? AND season_id = ? AND team_id = ?`,
    [accountId, permissionId, seasonId, teamId],
    connection
  );
};
