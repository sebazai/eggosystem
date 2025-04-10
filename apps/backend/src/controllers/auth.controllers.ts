import { type UserPayload } from "@eggosystem/types";
import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import {
  clearCookies,
  generateTokens,
  setCookies,
  getJWTValues
} from "../services/auth.services";
import { redisClient } from "../utils/redisClient";

const { JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = getJWTValues();

export const login = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error("No user");
  }

  const user = req.user as UserPayload;
  const jti = uuid();
  const { accessToken, refreshToken } = generateTokens(user, jti);

  await redisClient.set(jti, refreshToken, "EX", JWT_REFRESH_EXPIRES_IN);

  setCookies(res, accessToken, refreshToken);
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "No refresh token" });
    return;
  }

  try {
    const decoded = <jwt.JwtPayload>(
      jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    );
    const storedToken = await redisClient.get(decoded.jti!);

    if (!storedToken || storedToken !== refreshToken) {
      clearCookies(res);
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(decoded);

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
    res.status(403).json({ message: "Error while updating refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    try {
      const decoded = <jwt.JwtPayload>(
        jwt.verify(refreshToken, JWT_REFRESH_SECRET)
      );
      await redisClient.del(decoded.jti!);
    } catch (_err) {
      // NO-op
    }
  }
  clearCookies(res);
  res.json({ message: "Logged out" });
};
