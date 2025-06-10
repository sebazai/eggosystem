import _ from "lodash";
import { logger } from "../utils/app-logger";
import { createAbortController } from "../utils/fetch-utils";
import {
  type ISteamUserResponse,
  type IPlayerServiceResponse
} from "@eggosystem/types";

export const getSteamHoursForAppId = async (
  steam_id: string,
  app_id: number
) => {
  // E2E Mode: Return mock data based on Steam ID
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    // InsufficientHoursPlayer - return null to simulate hours detection failure
    if (steam_id === "76561197960269868") {
      return null;
    }

    // RaceConditionPlayer - return null to simulate API failure
    if (steam_id === "76561197960280002") {
      return null;
    }

    // Default: Return sufficient hours for all other Steam IDs
    return {
      appid: 730, // CS2
      playtime_forever: 90000 // 1500 hours in minutes
    };
  }

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
      logger.warn(
        `[Steam] API returned ${fromSteam.status} ${fromSteam.statusText} for steam_id: ${steam_id} (${duration}ms)`
      );
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

export const areSteamProfilesPublic = async (steam_ids: string[]) => {
  const { controller, clearAbortTimeout } = createAbortController(
    "areSteamProfilesPublic"
  );

  const ids = steam_ids.join(",");
  const steamUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${ids}`;
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
      `[Steam] Failed to fetch steam profiles for ${steam_ids.length} players - ${result.status} (${duration}ms):`,
      text
    );
    throw new Error("Failed to fetch steam profiles public status");
  }

  const data: ISteamUserResponse = await result.json();

  const fetchedSteamIds = data.response.players.map((p) => p.steamid);
  const diff = _.xor(steam_ids, fetchedSteamIds);
  if (diff.length > 0) {
    throw new Error(`Failed to fetch steam ids ${diff.join(",")}`);
  }

  const isPublic: Record<string, boolean> = Object.fromEntries(
    data.response.players.map((p) => [
      p.steamid,
      p.communityvisibilitystate === 3
    ])
  );

  const allPublic = Object.values(isPublic).every((v) => v === true);
  if (allPublic) {
    return { is_all_public: allPublic };
  }

  const hiddenProfiles = Object.keys(isPublic).filter((key) => !isPublic[key]);
  return { is_all_public: allPublic, not_public: hiddenProfiles };
};
