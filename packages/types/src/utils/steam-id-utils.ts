/**
 * Shared Steam ID utility functions for use in both frontend and backend.
 * Uses BigInt to handle large SteamID64 values that exceed JavaScript's safe integer limit.
 */

/**
 * Validates if a string is a valid SteamID64 (17-digit numeric string).
 *
 * @param steamId The Steam ID string to validate
 * @returns Boolean indicating if the Steam ID is valid
 */
export function isValidSteamId(steamId: string): boolean {
  if (!steamId) return false;
  return /^\d{17}$/.test(steamId);
}

/**
 * Extracts SteamID64 from Steam profile URLs.
 * Handles formats like:
 * - https://steamcommunity.com/profiles/76561198049745649
 * - http://steamcommunity.com/profiles/76561198049745649
 * - steamcommunity.com/profiles/76561198049745649
 * - /profiles/76561198049745649
 *
 * @param input The input string that may contain a Steam profile URL
 * @returns The extracted SteamID64, or null if not found
 */
export function extractSteamId64FromProfileUrl(input: string): string | null {
  const trimmed = input.trim();

  // Match full Steam community URLs with /profiles/
  const fullUrlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/profiles\/(\d{17})(?:\/|$|\?|#|)/i
  );

  // Match /profiles/ URLs without domain
  const pathMatch = trimmed.match(/\/profiles\/(\d{17})(?:\/|$|\?|#|)/i);

  const match = fullUrlMatch || pathMatch;
  if (match && match[1]) {
    const steamId64 = match[1];
    if (isValidSteamId(steamId64)) {
      return steamId64;
    }
  }

  return null;
}

/**
 * Converts SteamID format (STEAM_X:Y:Z) to SteamID64
 * Uses BigInt to handle large SteamID64 values that exceed JavaScript's safe integer limit.
 *
 * @param steamId SteamID in format STEAM_X:Y:Z
 * @returns SteamID64 (17-digit numeric string)
 * @throws {Error} If the Steam ID format is invalid
 */
export function convertSteamIdToSteamId64(steamId: string): string {
  const trimmedId = steamId.trim();

  // Match STEAM_X:Y:Z format
  const steamIdMatch = trimmedId.match(/^STEAM_[01]:([01]):(\d+)$/);
  if (!steamIdMatch) {
    throw new Error("Invalid SteamID format. Expected STEAM_X:Y:Z");
  }

  const y = BigInt(steamIdMatch[1] || "0");
  const z = BigInt(steamIdMatch[2] || "0");

  // Formula: SteamID64 = (Z * 2) + Y + 76561197960265728
  const steamId64 = (
    z * BigInt(2) +
    y +
    BigInt("76561197960265728")
  ).toString();

  if (!isValidSteamId(steamId64)) {
    throw new Error("Failed to convert SteamID to SteamID64");
  }

  return steamId64;
}

/**
 * Converts SteamID3 format ([U:1:AccountID]) to SteamID64
 * Uses BigInt to handle large SteamID64 values that exceed JavaScript's safe integer limit.
 *
 * @param steamId3 SteamID3 in format [U:1:AccountID]
 * @returns SteamID64 (17-digit numeric string)
 * @throws {Error} If the Steam ID format is invalid
 */
export function convertSteamId3ToSteamId64(steamId3: string): string {
  const trimmedId = steamId3.trim();

  // Match [U:1:AccountID] format
  const steamId3Match = trimmedId.match(/^\[U:1:(\d+)\]$/);
  if (!steamId3Match) {
    throw new Error("Invalid SteamID3 format. Expected [U:1:AccountID]");
  }

  const accountId = BigInt(steamId3Match[1] || "0");

  // Formula: SteamID64 = AccountID + 76561197960265728
  const steamId64 = (accountId + BigInt("76561197960265728")).toString();

  if (!isValidSteamId(steamId64)) {
    throw new Error("Failed to convert SteamID3 to SteamID64");
  }

  return steamId64;
}
