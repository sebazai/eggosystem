import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Cached JWT token for performance
let cachedJWTToken: string | null = null;

/**
 * Generate a valid JWT token for E2E testing
 * Uses the same private key and algorithm as the backend
 * Returns a cached token for performance
 */
export function generateTestJWT(): string {
  // Return cached token if available
  if (cachedJWTToken) {
    return cachedJWTToken;
  }

  try {
    // Read the private key that the E2E backend uses
    const privateKey = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../../apps/backend/private_access_token.pem"
      ),
      "utf8"
    );

    // Create a payload that matches what the backend expects and references a real E2E user
    // The E2E seed creates users with account IDs 15001-15013 and sets their emails/policies
    // Let's use account ID 15004 which should exist in the E2E database but has no existing registration
    const payload = {
      account_id: 15004,
      provider_id: "66561198999999902", // This matches heppajpg's NEW Steam ID from E2E seed
      permissions: [],
      roles: [],
      nickname: "heppajpg",
      provider: "steam" as const
    };

    // Sign the token with the same algorithm the backend uses
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "1h"
    });

    // Cache the token for subsequent use
    cachedJWTToken = token;
    return token;
  } catch (error) {
    console.warn("Could not generate real JWT token, using fallback:", error);
    // Fallback to the token the mocks expect
    const fallbackToken = "valid_token";
    cachedJWTToken = fallbackToken;
    return fallbackToken;
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

/**
 * Clear the cached JWT token
 * Useful for testing different token scenarios
 */
export function clearCachedJWT(): void {
  cachedJWTToken = null;
}
