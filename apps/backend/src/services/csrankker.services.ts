import { type CSRankkerResponse } from "@eggosystem/types";
import { logger } from "../utils/app-logger";

/**
 * Calculate kana_elo for a player using CSRankker API
 * @param steamId The steam ID of the player
 * @param seasonId Optional season ID. If not provided, uses active season
 * @returns Promise resolving to CSRankkerResponse or null if error
 */
export const calculateKanaElo = async (
  steamId: string,
  seasonId?: number
): Promise<CSRankkerResponse | null> => {
  const csRankkerUrl =
    process.env.CSRANKKER_BACKEND_API ||
    "https://csrankker.kanaliiga.fi/api/v1/kanaelo";

  // Build URL with optional season parameter
  let url = `${csRankkerUrl}/${steamId}`;
  if (seasonId) {
    url += `?season=${seasonId}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn(
        `[CSRankker] API returned ${response.status} for steam_id: ${steamId}`
      );
      return null;
    }

    const data: CSRankkerResponse = await response.json();

    if (data.status !== "success") {
      logger.warn(
        `[CSRankker] API returned unsuccessful status for steam_id: ${steamId}`
      );
      return null;
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.warn(`[CSRankker] Request timeout for steam_id: ${steamId}`);
    } else {
      logger.error(
        `[CSRankker] Failed to fetch kana_elo for steam_id: ${steamId}`,
        error
      );
    }
    return null;
  }
};
