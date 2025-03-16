import { type UserPayload } from "@eggosystem/types";
import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { redisClient } from "../utils/redisClient";
import { getPath } from "../utils/path";
import { v4 as uuid } from "uuid";

const setJWTValues = () => {
  const expireIn7Days = 7 * 24 * 60 * 60;
  const expireIn20m = 20 * 60;
  const JWT_EXPIRES_IN_AS_NUM = isNaN(Number(process.env.JWT_EXPIRES_IN))
    ? expireIn20m
    : Number(process.env.JWT_EXPIRES_IN);

  const JWT_REFRESH_EXPIRES_IN_AS_NUM = isNaN(
    Number(process.env.JWT_REFRESH_EXPIRES_IN)
  )
    ? expireIn7Days
    : Number(process.env.JWT_REFRESH_EXPIRES_IN);

  if (process.env.NODE_ENV === "production") {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    // const JWT_EXPIRES_IN = JWT_EXPIRES_IN_AS_NUM;
    // const JWT_REFRESH_EXPIRES_IN = JWT_REFRESH_EXPIRES_IN_AS_NUM;
    return {
      JWT_SECRET,
      JWT_REFRESH_SECRET,
      JWT_EXPIRES_IN: 30,
      JWT_REFRESH_EXPIRES_IN: 120
    };
  }
  const JWT_SECRET = process.env.JWT_SECRET ?? "your_jwt_secret";
  const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? "your_refresh_secret";

  return {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRES_IN: 30,
    JWT_REFRESH_EXPIRES_IN: 120
  };
};

const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
} = setJWTValues();

const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getPath("/")
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getPath("/api/v1/auth/refresh")
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getPath("/api/v1/auth/logout")
  });
};

const clearCookies = (res: Response) => {
  res.clearCookie("access_token", { path: getPath("/") });
  res.clearCookie("refresh_token", {
    path: getPath("/api/v1/auth/refresh")
  });
  res.clearCookie("refresh_token", {
    path: getPath("/api/v1/auth/logout")
  });
};

export const generateTokens = (user: jwt.JwtPayload, jti?: string) => {
  const { exp, iat, ...rest } = user;
  const withJwtId = jti ? { ...rest, jti } : rest;
  console.log("JWT_EXPIRES_IN", JWT_EXPIRES_IN);
  console.log("JWT_REFRESH_EXPIRES_IN", JWT_REFRESH_EXPIRES_IN);
  const accessToken = jwt.sign(withJwtId, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
  const refreshToken = jwt.sign(withJwtId, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  });
  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication failed" });
    return;
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
