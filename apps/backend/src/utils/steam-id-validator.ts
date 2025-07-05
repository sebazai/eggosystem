import { BadRequestError } from "./errors";

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
  if (!steamId) return false;

  // Basic validation for Steam ID 64 format (17 digits)
  return /^\d{17}$/.test(steamId);
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
 * Validates and normalizes a Steam ID.
 * Currently only supports and returns Steam ID 64 format.
 *
 * @param steamId The Steam ID string to validate and normalize
 * @returns The normalized Steam ID
 * @throws {BadRequestError} If the Steam ID format is invalid or unsupported
 */
export function normalizeSteamId(steamId: string): string {
  // Remove any whitespace
  const trimmedId = steamId.trim();

  // Check if it's already a valid Steam ID 64
  if (isValidSteamId(trimmedId)) {
    return trimmedId;
  }

  // For future: Add conversion from other Steam ID formats

  throw new BadRequestError("Unsupported Steam ID format");
}
