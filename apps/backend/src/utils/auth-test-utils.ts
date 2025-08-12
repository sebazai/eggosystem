import jwt from "jsonwebtoken";
import { getJWTValues } from "../configs/jwt-keys";

export function generateTestJWT(): string {
  return generateTestJWTForUser(15004, "66561198999999902", "heppajpg");
}

export function generateTestJWTForUser(
  accountId: number,
  steamId: string,
  nickname: string
): string {
  // In test environment, just return the expected mock token
  // that our mocked express-jwt middleware recognizes
  if (process.env.NODE_ENV === "test") {
    return "mock-access-token";
  }

  const { JWT_PRIVATE_KEY } = getJWTValues();

  const payload = {
    account_id: accountId,
    provider_id: steamId,
    provider: "steam",
    nickname: nickname,
    roles: ["admin"],
    permissions: ["admin:all"],
    jti: "test-jti-123",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
  };

  return jwt.sign(payload, JWT_PRIVATE_KEY, { algorithm: "RS256" });
}
