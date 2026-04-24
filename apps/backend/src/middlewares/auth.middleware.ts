import { expressjwt } from "express-jwt";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../services/auth.services";
import { JWT_PUBLIC_KEY } from "../configs/jwt-keys";
import {
  ForbiddenError,
  UnauthorizedError,
  BadRequestError
} from "../utils/errors";
import { buildPermissionString } from "../utils/permission-scope-builder";

interface CheckPermissionOptions {
  staticPermissions?: string[];
  role?: string; // e.g., "captain"
  action?: string; // e.g., "edit-registration"
  paramKeys?: string[]; // e.g., ["season_id", "team_id"]
  fallbackRoles?: string[];
}

/**
 * Not stateless. Checks permissions from Redis / DB.
 * @param param0
 * @returns
 */
export function checkPermissions({
  staticPermissions,
  role,
  action,
  paramKeys = [],
  fallbackRoles = []
}: CheckPermissionOptions): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.auth) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    const permissions: string[] = await getPermissionsForAccountId(
      req.auth.account_id
    );

    const roles = await getRolesForAccountId(req.auth.account_id);

    // Static permission check
    if (staticPermissions?.some((perm) => permissions.includes(perm))) {
      return next();
    }

    // Build dynamic permission
    if (action && paramKeys.length > 0) {
      // Check for role-based permission: role:action:scope (e.g., "captain:edit-registration:season-1:team-2")
      if (role) {
        try {
          const dynamicPermission = buildPermissionString(
            action,
            req.params,
            paramKeys,
            role
          );
          if (permissions.includes(dynamicPermission)) {
            return next();
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.startsWith("Missing route param")
          ) {
            return next(new BadRequestError(error.message));
          }
          throw error;
        }
      }

      // Also check for direct permission scope: action:scope (e.g., "edit-registration:season-1:team-2")
      // This format is used when users have AccountPermissionScopes without the corresponding role
      try {
        const directPermission = buildPermissionString(
          action,
          req.params,
          paramKeys
        );
        if (permissions.includes(directPermission)) {
          return next();
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("Missing route param")
        ) {
          return next(new BadRequestError(error.message));
        }
        throw error;
      }
    }

    if (fallbackRoles.some((role) => roles.includes(role))) {
      return next();
    }

    return next(new ForbiddenError("Forbidden: Insufficient permissions"));
  };
}

/**
 * Stateless permission check from JWT token. Used in non-critical endpoints.
 * @param param0
 * @returns
 */
export function checkJWTPermissions({
  staticPermissions,
  role,
  action,
  paramKeys = [],
  fallbackRoles = []
}: CheckPermissionOptions): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.auth) {
      return next(new ForbiddenError("Forbidden: Requires authentication"));
    }

    const permissions = req.auth.permissions;
    const roles = req.auth.roles;

    // Static permission check
    if (staticPermissions?.some((perm) => permissions.includes(perm))) {
      return next();
    }

    // Build dynamic permission
    if (action && paramKeys.length > 0) {
      // Check for role-based permission: role:action:scope (e.g., "captain:edit-registration:season-1:team-2")
      if (role) {
        try {
          const dynamicPermission = buildPermissionString(
            action,
            req.params,
            paramKeys,
            role
          );
          if (permissions.includes(dynamicPermission)) {
            return next();
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.startsWith("Missing route param")
          ) {
            return next(new BadRequestError(error.message));
          }
          throw error;
        }
      }

      // Also check for direct permission scope: action:scope (e.g., "edit-registration:season-1:team-2")
      // This format is used when users have AccountPermissionScopes without the corresponding role
      try {
        const directPermission = buildPermissionString(
          action,
          req.params,
          paramKeys
        );
        if (permissions.includes(directPermission)) {
          return next();
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("Missing route param")
        ) {
          return next(new BadRequestError(error.message));
        }
        throw error;
      }
    }

    if (fallbackRoles.some((role) => roles.includes(role))) {
      return next();
    }

    return next(new ForbiddenError("Forbidden: Insufficient permissions"));
  };
}

export const authenticateJWT = expressjwt({
  secret: JWT_PUBLIC_KEY,
  algorithms: ["RS256"],
  getToken: (req) => {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      return req.headers.authorization.split(" ")[1];
    }

    return req.cookies?.access_token || null;
  }
});
