import { expressjwt } from "express-jwt";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getPermissionsForAccountId } from "../services/auth.services";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

interface CheckPermissionOptions {
  staticPermissions?: string[];
  role?: string; // e.g., "captain"
  action?: string; // e.g., "edit-registration"
  paramKeys?: string[]; // e.g., ["season_id", "team_id"]
  fallbackRoles?: string[];
}

export function checkPermission({
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
      res
        .status(403)
        .json({ error: { message: "Forbidden: Requires authentication" } });
      return;
    }

    const permissions: string[] = await getPermissionsForAccountId(
      req.auth.account_id
    );

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
          res
            .status(400)
            .json({ error: { message: `Missing route param: ${key}` } });
          return;
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

    if (fallbackRoles.some((role) => permissions.includes(role))) {
      return next();
    }

    res
      .status(403)
      .json({ error: { message: "Forbidden: Insufficient permissions" } });
    return;
  };
}

export const authenticateJWT = expressjwt({
  secret: JWT_SECRET,
  algorithms: ["HS256"],
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
