import { UserPayload } from "@eggosystem/types";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import redisClient from "../utils/redisClient";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret";
const JWT_EXPIRES_IN = "20m";
const JWT_REFRESH_EXPIRES_IN = "7d";

export const generateTokens = (user: jwt.JwtPayload) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { exp, iat, ...rest } = user;
  const accessToken = jwt.sign(rest, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(rest, JWT_REFRESH_SECRET, {
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
  const { accessToken, refreshToken } = generateTokens(user);

  await redisClient.set(user.steamId, refreshToken, { EX: 7 * 24 * 60 * 60 });

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth/refresh"
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth/logout"
  });

  res.redirect(`http://localhost:3000/login-success`);
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
    const storedToken = await redisClient.get(decoded.steamId);

    if (!storedToken || storedToken === refreshToken) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(decoded);
    await redisClient.set(decoded.steamId, newRefreshToken, {
      EX: 7 * 24 * 60 * 60
    });

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh"
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/logout"
    });
    res.json({ message: "Token refreshed" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    try {
      const decoded = <jwt.JwtPayload>(
        jwt.verify(refreshToken, JWT_REFRESH_SECRET)
      );
      await redisClient.del(decoded.steamId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // NO-op
    }
  }
  res.clearCookie("access_token");
  res.clearCookie("refresh_token", { path: "/api/v1/auth/refresh" });
  res.clearCookie("refresh_token", { path: "/api/v1/auth/logout" });
  res.json({ message: "Logged out" });
};
