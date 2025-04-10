import { expireIn20m, expireIn7Days } from "../utils/redisClient";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { getPath } from "../utils/path";

export const getJWTValues = () => {
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
    return {
      JWT_SECRET,
      JWT_REFRESH_SECRET,
      JWT_EXPIRES_IN: expireIn20m,
      JWT_REFRESH_EXPIRES_IN: expireIn7Days
    };
  }
  const JWT_SECRET = process.env.JWT_SECRET ?? "your_jwt_secret";
  const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? "your_refresh_secret";
  const JWT_EXPIRES_IN = JWT_EXPIRES_IN_AS_NUM;
  const JWT_REFRESH_EXPIRES_IN = JWT_REFRESH_EXPIRES_IN_AS_NUM;

  return {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN
  };
};
const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
} = getJWTValues();

export const generateTokens = (user: jwt.JwtPayload, jti?: string) => {
  const { exp, iat, ...rest } = user;
  const withJwtId = jti ? { ...rest, jti } : rest;
  const accessToken = jwt.sign(withJwtId, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
  const refreshToken = jwt.sign(withJwtId, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
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
