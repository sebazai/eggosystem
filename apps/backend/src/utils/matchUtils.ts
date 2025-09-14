import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { BadRequestError } from "./errors";

/**
 * Extracts Faceit room ID from a Faceit URL or returns the input if it's already a room ID
 * @param input - Faceit URL or room ID
 * @returns The extracted room ID or the original input
 */
export function extractFaceitRoomId(input: string): string {
  if (!input) return input;

  // Check if input looks like a Faceit URL
  const faceitUrlPattern =
    /(?:https?:\/\/)?(?:www\.)?faceit\.com\/[^/]+\/[^/]+\/room\/(.+)$/;
  const match = input.match(faceitUrlPattern);

  if (match && match[1]) {
    return match[1];
  }

  // Return input as-is if it doesn't match URL pattern
  return input;
}

/**
 * Resolves a match identifier to the internal match ID
 * @param matchInput - Can be numeric match ID, Faceit room ID, or Faceit URL
 * @param seasonId - The season ID to search within
 * @param connection - Optional database connection
 * @returns The internal match ID from the Matches table
 * @throws BadRequestError if the match is not found or input is invalid
 */
export async function resolveMatchId(
  matchInput: string,
  seasonId: number,
  connection?: PoolConnection
): Promise<number[]> {
  if (!matchInput) {
    throw new BadRequestError("Match ID cannot be empty");
  }

  // Extract room ID if it's a Faceit URL
  const processedInput = extractFaceitRoomId(matchInput);

  // Check if it's a numeric ID
  const numericId = Number(processedInput);
  if (!isNaN(numericId) && Number.isInteger(numericId) && numericId > 0) {
    // Query by numeric ID
    const results = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Matches WHERE id = ? AND season_id = ?",
      [numericId, seasonId],
      connection
    );

    if (results.length === 0) {
      throw new BadRequestError(
        `Match with ID ${numericId} not found in season ${seasonId}`
      );
    }

    return [results[0].id];
  }

  // Check if it looks like a Faceit room ID (contains hyphens and alphanumeric)
  const faceitRoomPattern = /^[0-9]+-[a-zA-Z0-9-]+$/;
  if (faceitRoomPattern.test(processedInput)) {
    // Query by Faceit room ID
    const results = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Matches WHERE external_match_room_id = ? AND season_id = ?",
      [processedInput, seasonId],
      connection
    );

    if (results.length === 0) {
      throw new BadRequestError(
        `Match with Faceit room ID '${processedInput}' not found in season ${seasonId}`
      );
    }

    return results.map((result) => result.id);
  }

  // If we get here, the input format is invalid
  throw new BadRequestError(`Invalid match ID format: ${processedInput}`);
}
