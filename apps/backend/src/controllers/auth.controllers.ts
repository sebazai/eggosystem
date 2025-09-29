import { type SteamUserPayload } from "@eggosystem/types";
import { type Request, type Response, type NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import {
  clearCookies,
  generateTokens,
  setCookies,
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../services/auth.services";
import { redisClient } from "../utils/redisClient";
import { getJWTValues } from "../configs/jwt-keys";

const { JWT_REFRESH_PUBLIC_KEY, JWT_REFRESH_EXPIRES_IN } = getJWTValues();

export const login = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error("No user");
  }

  const user = req.user as SteamUserPayload;
  const jti = uuid();

  const permissions = await getPermissionsForAccountId(user.account_id);
  const roles = await getRolesForAccountId(user.account_id);
  const userWithPermissions = {
    ...user,
    permissions,
    roles
  };

  const { accessToken, refreshToken } = generateTokens(
    userWithPermissions,
    jti
  );

  await redisClient.set(jti, refreshToken, "EX", JWT_REFRESH_EXPIRES_IN);

  setCookies(res, accessToken, refreshToken);
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return next(new UnauthorizedError("No refresh token"));
  }

  try {
    const decoded = <jwt.JwtPayload>jwt.verify(
      refreshToken,
      JWT_REFRESH_PUBLIC_KEY,
      {
        algorithms: ["RS256"]
      }
    );
    const storedToken = await redisClient.get(decoded.jti!);

    if (!storedToken || storedToken !== refreshToken) {
      clearCookies(res);
      return next(new ForbiddenError("Invalid refresh token"));
    }

    // Refresh permissions.
    const permissions = await getPermissionsForAccountId(decoded.account_id);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      ...decoded,
      permissions
    });

    await redisClient.set(
      decoded.jti!,
      newRefreshToken,
      "EX",
      JWT_REFRESH_EXPIRES_IN
    );

    setCookies(res, accessToken, newRefreshToken);
    res.json({ message: "Token refreshed" });
  } catch (_err) {
    clearCookies(res);
    return next(new ForbiddenError("Error while updating refresh token"));
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    try {
      const decoded = <jwt.JwtPayload>jwt.verify(
        refreshToken,
        JWT_REFRESH_PUBLIC_KEY,
        {
          algorithms: ["RS256"]
        }
      );
      await redisClient.del(decoded.jti!);
    } catch (_err) {
      // NO-op
    }
  }
  clearCookies(res);
  res.json({ message: "Logged out" });
};
