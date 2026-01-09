import { expressjwt } from "express-jwt";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../services/auth.services";
import { JWT_PUBLIC_KEY } from "../configs/jwt-keys";
import { logger } from "../utils/app-logger";
import {
  ForbiddenError,
  UnauthorizedError,
  BadRequestError
} from "../utils/errors";

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
      return next(new UnauthorizedError("Forbidden: Requires authentication"));
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
    if (role && action && paramKeys.length > 0) {
      const scopeParts: string[] = [];

      for (const key of paramKeys) {
        const value = req.params[key];
        if (!value) {
          return next(new BadRequestError(`Missing route param: ${key}`));
        }

        // key = "season_id" -> scope part = "season-<id>"
        const scopePart = key.replace("_id", "") + "-" + value;
        scopeParts.push(scopePart);
      }

      const dynamicPermission = `${role}:${action}:${scopeParts.join(":")}`;

      if (permissions.includes(dynamicPermission)) {
        return next();
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
    if (role && action && paramKeys.length > 0) {
      const scopeParts: string[] = [];

      for (const key of paramKeys) {
        const value = req.params[key];
        if (!value) {
          return next(new BadRequestError(`Missing route param: ${key}`));
        }

        // key = "season_id" -> scope part = "season-<id>"
        const scopePart = key.replace("_id", "") + "-" + value;
        scopeParts.push(scopePart);
      }

      const dynamicPermission = `${role}:${action}:${scopeParts.join(":")}`;

      if (permissions.includes(dynamicPermission)) {
        return next();
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

const checkApiKeyOrJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check for API key first
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env.BACKEND_SERVICE_API_KEY) {
    logger.info("API key authentication successful");
    return next(); // API key is valid, proceed
  }

  // If no valid API key, use JWT authentication
  void authenticateJWT(req, res, (err) => {
    if (err) {
      return next(
        new UnauthorizedError(
          "Authentication required. Please provide a valid token or API key."
        )
      );
    }

    // Check JWT permissions
    void checkPermissions({ fallbackRoles: ["admin"] })(req, res, next);
  });
};
