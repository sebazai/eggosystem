import { BadRequestError } from "./errors";
import {
  isValidSteamId as sharedIsValidSteamId,
  convertSteamIdToSteamId64 as sharedConvertSteamIdToSteamId64,
  convertSteamId3ToSteamId64 as sharedConvertSteamId3ToSteamId64,
  extractSteamId64FromProfileUrl
} from "@eggosystem/types";

/**
 * Utility functions for validating Steam IDs
 */

/**
 * Validates if a string is a valid Steam ID.
 * Currently only supports Steam ID 64 format (17-digit numeric string).
 *
 * @param steamId The Steam ID string to validate
 * @returns Boolean indicating if the Steam ID is valid
 */
export function isValidSteamId(steamId: string): boolean {
  return sharedIsValidSteamId(steamId);
}

/**
 * Validates if a string is a valid Steam ID and throws a BadRequestError if invalid.
 * This is a convenience wrapper for validation in controllers.
 *
 * @param steamId The Steam ID string to validate
 * @param errorMessage Optional custom error message
 * @returns The validated Steam ID (for convenience)
 * @throws {BadRequestError} If the Steam ID is invalid
 */
export function validateSteamId(
  steamId: string,
  errorMessage = "Invalid Steam ID format"
): string {
  if (!isValidSteamId(steamId)) {
    throw new BadRequestError(errorMessage);
  }

  return steamId;
}

/**
 * Converts SteamID format (STEAM_X:Y:Z) to SteamID64
 *
 * @param steamId SteamID in format STEAM_X:Y:Z
 * @returns SteamID64 (17-digit numeric string)
 * @throws {BadRequestError} If the Steam ID format is invalid
 */
export function convertSteamIdToSteamId64(steamId: string): string {
  try {
    return sharedConvertSteamIdToSteamId64(steamId);
  } catch (error) {
    // Wrap generic Error in BadRequestError for backend consistency
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError("Failed to convert SteamID to SteamID64");
  }
}

/**
 * Converts SteamID3 format ([U:1:AccountID]) to SteamID64
 *
 * @param steamId3 SteamID3 in format [U:1:AccountID]
 * @returns SteamID64 (17-digit numeric string)
 * @throws {BadRequestError} If the Steam ID format is invalid
 */
export function convertSteamId3ToSteamId64(steamId3: string): string {
  try {
    return sharedConvertSteamId3ToSteamId64(steamId3);
  } catch (error) {
    // Wrap generic Error in BadRequestError for backend consistency
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }
    throw new BadRequestError("Failed to convert SteamID3 to SteamID64");
  }
}

/**
 * Detects the Steam ID format and returns the SteamID64.
 * Supports: SteamID64, SteamID, SteamID3 formats, and URLs containing SteamID64.
 * Note: Custom URLs (vanity URLs) must be resolved via API call separately.
 *
 * @param steamId The Steam ID string to validate and normalize
 * @returns The normalized Steam ID 64
 * @throws {BadRequestError} If the Steam ID format is invalid or unsupported
 */
export function normalizeSteamId(steamId: string): string {
  // Remove any whitespace
  const trimmedId = steamId.trim();

  // Check if it's already a valid Steam ID 64
  if (isValidSteamId(trimmedId)) {
    return trimmedId;
  }

  // Extract SteamID64 from /profiles/ URLs (these contain SteamID64 directly)
  const steamId64FromUrl = extractSteamId64FromProfileUrl(trimmedId);
  if (steamId64FromUrl) {
    return steamId64FromUrl;
  }

  // Try SteamID format (STEAM_X:Y:Z)
  if (trimmedId.startsWith("STEAM_")) {
    return convertSteamIdToSteamId64(trimmedId);
  }

  // Try SteamID3 format ([U:1:AccountID])
  if (trimmedId.startsWith("[") && trimmedId.endsWith("]")) {
    return convertSteamId3ToSteamId64(trimmedId);
  }

  throw new BadRequestError(
    "Unsupported Steam ID format. Supported formats: SteamID64 (17 digits), SteamID (STEAM_X:Y:Z), SteamID3 ([U:1:AccountID]), or Steam profile URLs (/profiles/SteamID64). For custom URLs, use resolveSteamIdVanityURL."
  );
}
