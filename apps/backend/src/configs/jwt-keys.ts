import fs from "fs";
import path from "path";
import { expireIn20m, expireIn7Days } from "../utils/redisClient";

export const JWT_PUBLIC_KEY = fs.readFileSync(
  path.resolve(process.cwd(), "public_access_token.pem"),
  "utf8"
);

const JWT_PRIVATE_KEY = fs.readFileSync(
  path.resolve(process.cwd(), "private_access_token.pem"),
  "utf8"
);

export const JWT_REFRESH_PUBLIC_KEY = fs.readFileSync(
  path.resolve(process.cwd(), "public_refresh_token.pem"),
  "utf8"
);

const JWT_REFRESH_PRIVATE_KEY = fs.readFileSync(
  path.resolve(process.cwd(), "private_refresh_token.pem"),
  "utf8"
);

export const getJWTValues = () => {
  const JWT_EXPIRES_IN_AS_NUM = isNaN(Number(process.env.JWT_EXPIRES_IN))
    ? expireIn20m
    : Number(process.env.JWT_EXPIRES_IN);

  const JWT_REFRESH_EXPIRES_IN_AS_NUM = isNaN(
    Number(process.env.JWT_REFRESH_EXPIRES_IN)
  )
    ? expireIn7Days
    : Number(process.env.JWT_REFRESH_EXPIRES_IN);

  const JWT_EXPIRES_IN = JWT_EXPIRES_IN_AS_NUM;
  const JWT_REFRESH_EXPIRES_IN = JWT_REFRESH_EXPIRES_IN_AS_NUM;

  return {
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
    JWT_REFRESH_PRIVATE_KEY,
    JWT_REFRESH_PUBLIC_KEY,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN
  };
};
