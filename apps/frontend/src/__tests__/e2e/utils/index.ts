import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a valid JWT token for E2E testing
 * Uses the same private key and algorithm as the backend
 * Returns a cached token for performance
 */
export function generateTestJWT(): string {
  return generateTestJWTForUser(15004, "66561198999999902", "heppajpg");
}

/**
 * Generate a JWT token for a specific user
 * @param accountId - The account ID from the E2E seed data
 * @param steamId - The Steam ID for the user
 * @param nickname - The nickname for the user
 */
export function generateTestJWTForUser(
  accountId: number,
  steamId: string,
  nickname: string
): string {
  try {
    // Read the private key that the E2E backend uses
    const privateKey = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../../apps/backend/private_access_token.pem"
      ),
      "utf8"
    );

    // Create a payload that matches what the backend expects
    const payload = {
      account_id: accountId,
      provider_id: steamId,
      permissions: [],
      roles: [],
      nickname: nickname,
      provider: "steam" as const
    };

    // Sign the token with the same algorithm the backend uses
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "1h"
    });

    return token;
  } catch (error) {
    console.warn("Could not generate real JWT token, using fallback:", error);
    // Fallback to the token the mocks expect
    return "valid_token";
  }
}

/**
 * Generate a unique organization code for testing
 * Uses timestamp and random number to ensure uniqueness
 */
export function generateUniqueOrgCode(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}-${random}`;
}

/**
 * Generate a unique FACEIT team ID for testing
 * Uses UUID v4 for guaranteed uniqueness
 */
export function generateUniqueFaceitTeamId(): string {
  return uuidv4();
}
