/**
 * Utility functions for parsing Faceit demo URLs
 *
 * If the map gets rehosted or swapped servers the second number (sequence_number) increases.
 * It's the instance / nth part of that map
 *
 * Demo URL format: https://demos-{region}.backblaze.faceit-cdn.net/cs2/{uuid}-{game_number}-{sequence_number}.dem.{compression}
 *
 * Examples:
 * - https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-eb22b581-8368-4ff7-8b2f-054d5d2c02e8-1-1.dem.zst
 * - https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-5a61efe1-4d92-4481-a7e2-0ef7ca1a7ca1-1-2.dem.gz
 */

interface DemoUrlInfo {
  mapNumber: number;
  sequenceNumber: number;
  matchId: string;
  compression: string;
}

/**
 * Parse a Faceit demo URL to extract game number and round number
 * @param demoUrl - The demo URL to parse
 * @returns Object containing parsed information or null if parsing fails
 */
export const parseDemoUrl = (demoUrl: string): DemoUrlInfo | null => {
  try {
    // Extract the filename from the URL
    const url = new URL(demoUrl);
    const pathSegments = url.pathname.split("/");
    const filename = pathSegments[pathSegments.length - 1];

    // Remove the .dem.{compression} extension
    const baseFilename = filename.replace(/\.dem\.(zst|gz)$/, "");

    // Use regex to match the pattern: {uuid}-{game_number}-{sequence_number}
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const match = baseFilename.match(/^(.+)-(\d+)-(\d+)$/);

    if (!match) {
      return null;
    }

    const [, uuid, gameNumberStr, sequenceNumberStr] = match;
    const mapNumber = parseInt(gameNumberStr, 10);
    const sequenceNumber = parseInt(sequenceNumberStr, 10);

    // Extract compression type
    const compressionMatch = filename.match(/\.dem\.(zst|gz)$/);
    const compression = compressionMatch ? compressionMatch[1] : "unknown";

    // Validate that we got valid numbers
    if (isNaN(mapNumber) || isNaN(sequenceNumber)) {
      return null;
    }

    return {
      mapNumber,
      sequenceNumber,
      matchId: uuid,
      compression
    } satisfies DemoUrlInfo;
  } catch (_error) {
    return null;
  }
};
