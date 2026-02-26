import _ from "lodash";
import { logger } from "../utils/app-logger";
import { createAbortController } from "../utils/fetch-utils";
import { isValidSteamId } from "../utils/steam-id-validator";
import {
  type ISteamUserResponse,
  type IPlayerServiceResponse
} from "@eggosystem/types";

export const getSteamHoursForAppId = async (
  steam_id: string,
  app_id: number
) => {
  const { controller, clearAbortTimeout } = createAbortController(
    "getSteamHoursForAppId"
  );

  try {
    const webURL = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steam_id}`;
    const fromSteam = await fetch(webURL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Kanaliiga-Eggosystem/1.0"
      }
    });

    if (!fromSteam.ok) {
      const duration = clearAbortTimeout();
      try {
        const text = await fromSteam.text();
        logger.warn(
          `[Steam] API returned ${fromSteam.status} ${fromSteam.statusText} for steam_id: ${steam_id} (${duration}ms):`,
          text
        );
      } catch (error) {
        logger.warn("Failed to parse steam response", error);
      }
      return null;
    }

    const data: IPlayerServiceResponse = await fromSteam.json();
    const games = data.response?.games;
    const requestedAppId = games?.find((game) => game.appid === app_id);

    const duration = clearAbortTimeout();
    if (!requestedAppId) {
      logger.info(
        `[Steam] No hours found for steam_id: ${steam_id}, app_id: ${app_id} (${duration}ms)`
      );
      return null;
    }

    return requestedAppId;
  } catch (error) {
    const duration = clearAbortTimeout();
    logger.error(
      `[Steam] Request failed for steam_id: ${steam_id} (${duration}ms):`,
      error
    );
    return null;
  }
};

export const isSteamProfilePublic = async (steam_id: string) => {
  const { controller, clearAbortTimeout } = createAbortController(
    "isSteamProfilePublic"
  );

  const steamUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steam_id}`;
  const result = await fetch(steamUrl, {
    signal: controller.signal,
    headers: {
      "User-Agent": "Kanaliiga-Eggosystem/1.0"
    }
  });

  if (!result.ok) {
    const duration = clearAbortTimeout();
    const text = await result.text();
    logger.error(
      `[Steam] Failed to fetch steam profile for ${steam_id} - ${result.status} (${duration}ms):`,
      text
    );
    throw new Error("Failed to fetch steam profile public status");
  }

  const data: ISteamUserResponse = await result.json();
  const duration = clearAbortTimeout();
  if (data.response.players.length === 0) {
    logger.error(
      `[Steam] Invalid steam id or profile not found: ${steam_id} (${duration}ms)`
    );
    throw new Error("Invalid steam id or profile not found");
  }

  const isPublic = data.response.players[0].communityvisibilitystate === 3;

  return isPublic;
};

/**
 * Resolves a Steam custom URL (vanity URL) to SteamID64 using Steam Web API.
 * Handles full Steam profile URLs (e.g., https://steamcommunity.com/id/sububobi)
 * and extracts just the vanity URL part (e.g., "sububobi").
 *
 * @param vanityUrl The custom URL (e.g., "sububobi", "https://steamcommunity.com/id/sububobi")
 * @returns SteamID64 (17-digit numeric string)
 * @throws {Error} If the vanity URL cannot be resolved or API call fails
 */
export const resolveSteamIdVanityURL = async (
  vanityUrl: string
): Promise<string> => {
  // Use a longer timeout for vanity URL resolution (15 seconds) since it's user-initiated
  const { controller, clearAbortTimeout } = createAbortController(
    "resolveSteamIdVanityURL",
    15000
  );

  try {
    let cleanedVanityUrl = vanityUrl.trim();

    // Extract vanity URL from full Steam profile URLs
    // Handles formats like:
    // - https://steamcommunity.com/id/sububobi
    // - http://steamcommunity.com/id/sububobi
    // - steamcommunity.com/id/sububobi
    // - /id/sububobi
    // - id/sububobi
    // - sububobi
    // Note: /profiles/ URLs are handled by normalizeSteamId() before this function is called
    const steamProfileMatch = cleanedVanityUrl.match(
      /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/id\/([^/?#]+)/i
    );
    if (steamProfileMatch) {
      cleanedVanityUrl = steamProfileMatch[1];
    } else {
      // If not a full URL, try to extract from paths like /id/username
      const idPathMatch = cleanedVanityUrl.match(/\/id\/([^/?#]+)/i);
      if (idPathMatch) {
        cleanedVanityUrl = idPathMatch[1];
      } else {
        // Remove any leading/trailing slashes and whitespace
        cleanedVanityUrl = cleanedVanityUrl.replace(/^\/+|\/+$/g, "");
      }
    }

    // If after cleaning we have a valid SteamID64, return it
    // (This handles edge cases where a SteamID64 was passed directly)
    if (isValidSteamId(cleanedVanityUrl)) {
      return cleanedVanityUrl;
    }

    const steamUrl = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${encodeURIComponent(cleanedVanityUrl)}`;
    const result = await fetch(steamUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Kanaliiga-Eggosystem/1.0"
      }
    });

    const duration = clearAbortTimeout();

    if (!result.ok) {
      const text = await result.text();
      logger.error(
        `[Steam] Failed to resolve vanity URL ${cleanedVanityUrl} - ${result.status} (${duration}ms):`,
        text
      );
      throw new Error(`Failed to resolve vanity URL: ${result.status}`);
    }

    const data = await result.json();

    // Steam API returns success: 1 if found, 42 if not found
    if (data.response?.success !== 1) {
      logger.warn(
        `[Steam] Vanity URL not found: ${cleanedVanityUrl} (${duration}ms)`
      );
      throw new Error(`Vanity URL not found: ${cleanedVanityUrl}`);
    }

    const steamId64 = data.response?.steamid;
    if (!steamId64 || typeof steamId64 !== "string") {
      logger.error(
        `[Steam] Invalid response format for vanity URL ${cleanedVanityUrl} (${duration}ms):`,
        data
      );
      throw new Error("Invalid response format from Steam API");
    }

    logger.info(
      `[Steam] Resolved vanity URL ${cleanedVanityUrl} to ${steamId64} (${duration}ms)`
    );

    return steamId64;
  } catch (error) {
    const duration = clearAbortTimeout();

    // Check if it's a timeout error
    if (error instanceof Error && error.name === "AbortError") {
      logger.error(
        `[Steam] Request timeout for vanity URL ${vanityUrl} (${duration}ms)`
      );
      throw new Error(
        `Steam API request timed out. Please try again or use a different Steam ID format.`,
        { cause: error }
      );
    }

    logger.error(
      `[Steam] Request failed for vanity URL ${vanityUrl} (${duration}ms):`,
      error
    );
    throw error;
  }
};
