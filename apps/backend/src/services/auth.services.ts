import { expireIn30Days, redisClient } from "../utils/redisClient";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { getPath } from "../utils/path";
import {
  type Role,
  type Permission,
  type Season,
  type Team
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { getJWTValues } from "../configs/jwt-keys";

export const flushPermissionsAndRolesForAccountId = async (
  accountId: number
) => {
  const redisPermissionKey = `permissions-${accountId}`;
  const redisRoleKey = `roles-${accountId}`;
  await redisClient.del(redisPermissionKey);
  await redisClient.del(redisRoleKey);
};

export const getDBPermissionsForAccountId = async (
  accountId: number,
  connection?: PoolConnection
) => {
  const permissionsResult = await runQuery<
    Array<{
      permission_name: Permission["permission_name"];
      role_name: Role["role_name"];
      season_id: Season["id"];
      team_id: Team["id"];
    }>
  >(
    `
    SELECT DISTINCT r.role_name, p.permission_name, aps.season_id, aps.team_id
      FROM Accounts a
      JOIN AccountRoles ar ON ar.account_id = a.id
      JOIN Roles r ON r.id = ar.role_id
      JOIN RolePermissions rp ON rp.role_id = ar.role_id
      JOIN Permissions p ON p.id = rp.permission_id
      LEFT JOIN AccountPermissionScopes aps ON aps.account_id = a.id AND aps.permission_id = p.id
      WHERE a.id = ?
    `,
    [accountId],
    connection
  );
  return permissionsResult;
};

export const getPermissionsForAccountId = async (
  accountId: number,
  connection?: PoolConnection
) => {
  const redisKey = `permissions-${accountId}`;
  const permissionsInRedis = await redisClient.get(redisKey);
  if (permissionsInRedis) {
    return permissionsInRedis.split(",");
  }

  const permissionsResult = await getDBPermissionsForAccountId(
    accountId,
    connection
  );

  if (permissionsResult.length > 0) {
    const permissions = permissionsResult.map(
      (row) =>
        `${row.role_name}:${row.permission_name}:season-${row.season_id}:team-${row.team_id}`
    );
    await redisClient.set(
      redisKey,
      permissions.join(","),
      "EX",
      expireIn30Days
    );
    return permissions;
  }
  return [];
};

export const getRolesForAccountId = async (accountId: number) => {
  const redisKey = `roles-${accountId}`;
  const rolesInRedis = await redisClient.get(redisKey);
  if (rolesInRedis) {
    return rolesInRedis.split(",");
  }

  const rolesResult = await runQuery<
    Array<{
      role_name: Role["role_name"];
    }>
  >(
    `
    SELECT DISTINCT r.role_name
      FROM Accounts a
      JOIN AccountRoles ar ON ar.account_id = a.id
      JOIN Roles r ON r.id = ar.role_id
      WHERE a.id = ?
    `,
    [accountId]
  );
  const roles = rolesResult.map((role) => role.role_name);
  if (roles.length > 0) {
    await redisClient.set(redisKey, roles.join(","), "EX", expireIn30Days);
  }
  return roles;
};

export const generateTokens = (user: jwt.JwtPayload, jti?: string) => {
  const {
    JWT_PRIVATE_KEY,
    JWT_REFRESH_PRIVATE_KEY,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN
  } = getJWTValues();
  const { exp, iat, ...rest } = user;
  const withJwtId = jti ? { ...rest, jti } : rest;
  const accessToken = jwt.sign(withJwtId, JWT_PRIVATE_KEY, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: "RS256"
  });
  const refreshToken = jwt.sign(withJwtId, JWT_REFRESH_PRIVATE_KEY, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    algorithm: "RS256"
  });
  return { accessToken, refreshToken };
};

export const clearCookies = (res: Response) => {
  res.clearCookie("access_token", { path: getPath("/") });
  res.clearCookie("refresh_token", {
    path: getPath("/api/v1/auth/refresh")
  });
  res.clearCookie("refresh_token", {
    path: getPath("/api/v1/auth/logout")
  });
};

export const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  const { JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = getJWTValues();
  const refreshExpiresIn = new Date(Date.now() + JWT_REFRESH_EXPIRES_IN * 1000);
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getPath("/"),
    maxAge: JWT_EXPIRES_IN * 1000
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getPath("/api/v1/auth/refresh"),
    maxAge: JWT_REFRESH_EXPIRES_IN * 1000,
    expires: refreshExpiresIn
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getPath("/api/v1/auth/logout"),
    maxAge: JWT_REFRESH_EXPIRES_IN * 1000,
    expires: refreshExpiresIn
  });
};
