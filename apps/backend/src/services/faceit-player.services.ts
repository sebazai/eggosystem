import {
  SeasonPlatform,
  type FaceITCSRank,
  type FaceitPlayerDetails
} from "@eggosystem/types";
import {
  redisClient,
  expireIn30Days,
  expireInOneDay
} from "../utils/redisClient";
import {
  getPlayerExternalRankForSeason,
  getLatestSeasonForPlayer
} from "../models/season-player-ranks.models";
import { logger } from "../utils/app-logger";
import { createAbortController } from "../utils/fetch-utils";
import {
  applyDecay,
  faceitEloToLevel,
  FACEIT_DEFAULT_ELO,
  FACEIT_DEFAULT_KD
} from "../utils/faceit-utils";
import {
  getRateLimitForService,
  setRateLimitForService
} from "../utils/rate-limit-utils";

export const convertFaceitGameToAppId = (game: string) => {
  switch (game) {
    case "6d9298b7-73e4-4672-96b5-720293ba2a4a":
      return 730;
    default:
      throw new Error(`Unknown game: ${game}`);
  }
};

/**
 * Base function to fetch player data from Faceit API
 *
 * FACEIT_API_KEY="KEY-HERE" pnpm --filter=backend exec ts-node src/scripts/backfillFaceitPlayerData.ts
 * @param steam_id The Steam ID of the player
 * @param game The game to fetch data for (cs2 or csgo)
 * @returns The complete player data from Faceit API
 */
export const fetchFaceitPlayerData = async (
  steam_id: string,
  game: "cs2" | "csgo"
): Promise<FaceitPlayerDetails | null> => {
  const redisKey = `faceit-player-${steam_id}-${game}`;
  const redisData = await redisClient.get(redisKey);
  if (redisData) {
    return JSON.parse(redisData) as FaceitPlayerDetails;
  }

  const rateLimit = await getRateLimitForService("FaceIT");
  if (rateLimit) {
    return null;
  }

  const { controller, clearAbortTimeout } = createAbortController(
    "fetchFaceitPlayerData"
  );

  try {
    const webURL = `https://open.faceit.com/data/v4/players?game=${game}&game_player_id=${steam_id}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      "User-Agent": "Kanaliiga-Eggosystem/1.0"
    };

    const response = await fetch(webURL, {
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      const duration = clearAbortTimeout();
      logger.warn(
        `[FaceIT] API returned ${response.status} ${response.statusText} for steam_id: ${steam_id} (${duration}ms)`
      );

      if (response.status === 404) {
        logger.warn(
          `[FaceIT] Player not found for steam_id: ${steam_id} (${duration}ms)`
        );
        return null;
      }

      if (response.status === 429) {
        await setRateLimitForService(
          "FaceIT",
          response.headers.get("Retry-After"),
          response.headers.get("X-RateLimit-Reset")
        );
      }

      throw new Error(
        `Failed to fetch Faceit player data: ${response.statusText}`
      );
    }

    const data: FaceitPlayerDetails = await response.json();
    clearAbortTimeout();

    if (data.faceit_url) {
      logger.info(`[FaceIT] Original faceit_url: ${data.faceit_url}`);
      data.faceit_url = data.faceit_url
        .replace(/\{lang\}/g, "en")
        .replace(/%7Blang%7D/g, "en");
      logger.info(`[FaceIT] Fixed faceit_url: ${data.faceit_url}`);
    }

    await redisClient.set(redisKey, JSON.stringify(data), "EX", expireInOneDay);
    return data;
  } catch (error) {
    clearAbortTimeout();
    logger.error(
      `[FaceIT] Error fetching player data for steam_id: ${steam_id}:`,
      error
    );
    throw error;
  }
};

/**
 * Gets player details from Faceit API by FaceIt user_id (player_id)
 */
export const getFaceitPlayerDetails = async (
  faceit_user_id: string
): Promise<FaceitPlayerDetails | null> => {
  const redisKey = `faceit-player-by-id-${faceit_user_id}`;
  const redisData = await redisClient.get(redisKey);
  if (redisData) {
    return JSON.parse(redisData) as FaceitPlayerDetails;
  }

  const rateLimit = await getRateLimitForService("FaceIT");
  if (rateLimit) {
    return null;
  }

  const { controller, clearAbortTimeout } = createAbortController(
    "getFaceitPlayerDetails"
  );

  try {
    const webURL = `https://open.faceit.com/data/v4/players/${faceit_user_id}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      "User-Agent": "Kanaliiga-Eggosystem/1.0"
    };

    const response = await fetch(webURL, {
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      const duration = clearAbortTimeout();
      logger.warn(
        `[FaceIT] API returned ${response.status} ${response.statusText} for faceit_user_id: ${faceit_user_id} (${duration}ms)`
      );

      if (response.status === 404) {
        logger.warn(
          `[FaceIT] Player not found for faceit_user_id: ${faceit_user_id} (${duration}ms)`
        );
        return null;
      }

      if (response.status === 429) {
        await setRateLimitForService(
          "FaceIT",
          response.headers.get("Retry-After"),
          response.headers.get("X-RateLimit-Reset")
        );
      }

      throw new Error(
        `Failed to fetch Faceit player data: ${response.statusText}`
      );
    }

    const data: FaceitPlayerDetails = await response.json();
    clearAbortTimeout();

    if (data.faceit_url) {
      data.faceit_url = data.faceit_url
        .replace(/\{lang\}/g, "en")
        .replace(/%7Blang%7D/g, "en");
    }

    await redisClient.set(redisKey, JSON.stringify(data), "EX", expireInOneDay);
    return data;
  } catch (error) {
    clearAbortTimeout();
    logger.error(
      `[FaceIT] Error fetching player data for faceit_user_id: ${faceit_user_id}:`,
      error
    );
    return null;
  }
};

/**
 * Get player's Faceit rank data for a specific game
 */
export const getFaceITGameRank = async (
  steam_id: string,
  game: "cs2" | "csgo"
) => {
  const playerData = await fetchFaceitPlayerData(steam_id, game);

  if (!playerData || !playerData.games || !playerData.games[game]) {
    return null;
  }

  const gameData = playerData.games[game];
  const elo = Number(gameData?.faceit_elo || 0);
  const rank = Number(gameData?.skill_level || 0);
  const player_id = playerData.player_id;

  if (Number.isNaN(elo) || Number.isNaN(rank)) {
    logger.warn(
      `[FaceIT] Invalid rank data for steam_id: ${steam_id}`,
      playerData
    );
    throw new Error("Invalid rank data");
  }

  return {
    elo,
    rank,
    player_id
  };
};

/**
 * Get player's Faceit rank data and URL for a specific game
 */
export const getFaceITGameRankWithUrl = async (
  steam_id: string,
  game: "cs2" | "csgo"
) => {
  try {
    const playerData = await fetchFaceitPlayerData(steam_id, game);

    if (!playerData || !playerData.games || !playerData.games[game]) {
      return null;
    }

    const gameData = playerData.games[game];
    const elo = Number(gameData?.faceit_elo || 0);
    const rank = Number(gameData?.skill_level || 0);
    const player_id = playerData.player_id;
    const faceit_url = playerData.faceit_url;

    if (Number.isNaN(elo) || Number.isNaN(rank)) {
      logger.warn(
        `[FaceIT] Invalid rank data for steam_id: ${steam_id}`,
        playerData
      );
      throw new Error("Invalid rank data");
    }

    return {
      elo,
      rank,
      player_id,
      faceit_url
    };
  } catch (error) {
    logger.error(`[FaceIT] Error for steam_id: ${steam_id}`, error);
    throw error;
  }
};

const getFaceITMetaData = async (
  faceit_player_id: string,
  game: "cs2" | "csgo" = "cs2"
): Promise<{
  faceit_kdr: number;
  faceit_matches_played: number;
  faceit_last_match: number;
} | null> => {
  const { controller, clearAbortTimeout } =
    createAbortController("getFaceITMetaData");

  try {
    const stats_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/stats/${game}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      "User-Agent": "Kanaliiga-Eggosystem/1.0"
    };

    const statsResponse = await fetch(stats_url, {
      headers,
      signal: controller.signal
    });
    const data = await statsResponse.json();

    const kdr = data["lifetime"]["Average K/D Ratio"];
    const matches_played = data["lifetime"]["Matches"];

    const game_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/games/${game}/stats`;
    const gameResponse = await fetch(game_url, {
      headers,
      signal: controller.signal
    });
    const gameData = await gameResponse.json();

    // CS2 rank exists but no CS2 games played — fall back to CSGO metadata for decay
    if (game === "cs2" && gameData.items.length === 0) {
      return getFaceITMetaData(faceit_player_id, "csgo");
    }

    const last_match = new Date(
      gameData.items[0]["stats"]["Created At"]
    ).getTime();

    clearAbortTimeout();

    const numKdr = Number(kdr);
    const numMatchesPlayed = Number(matches_played);

    if (isNaN(numKdr) || isNaN(numMatchesPlayed)) {
      logger.warn(
        `[FaceIT] NaN detected - returning null for faceit_player_id: ${faceit_player_id}`
      );
      return null;
    }

    return {
      faceit_kdr: Number(kdr),
      faceit_matches_played: Number(matches_played),
      faceit_last_match: last_match
    };
  } catch (error) {
    clearAbortTimeout();
    logger.warn(
      `[FaceIT] Failed to fetch metadata for player ${faceit_player_id}:`,
      error
    );
    return null;
  }
};

const fallbackFaceITRank = {
  faceit_level: 2,
  faceit_elo: FACEIT_DEFAULT_ELO,
  faceit_kd: 0.95,
  faceit_date: new Date().getTime(),
  metadata: {
    faceit_matches_played: undefined,
    faceit_last_match: undefined,
    faceit_decay: false,
    faceit_fallback: true
  }
} satisfies FaceITCSRank;

const faceitErrorRank = {
  faceit_level: -1,
  faceit_elo: -1,
  faceit_kd: -1,
  faceit_date: new Date().getTime(),
  metadata: {
    faceit_decay: false,
    faceit_fallback: true
  }
} satisfies FaceITCSRank;

const getFaceITCSGORank = async (steam_id: string) => {
  const data = await getFaceITGameRank(steam_id, "csgo");

  if (!data) {
    logger.warn(
      `[FaceIT] Failed to fetch CSGO rank for player ${steam_id} - returning fallbackFaceITRank`
    );
    return fallbackFaceITRank;
  }

  const faceit_metadata = await getFaceITMetaData(data.player_id, "csgo");

  const lastMatchThreeYearsAgo =
    new Date().getTime() - 3 * 365 * 24 * 60 * 60 * 1000;

  const decayedElo = applyDecay(
    data.elo,
    FACEIT_DEFAULT_ELO,
    faceit_metadata?.faceit_last_match ?? lastMatchThreeYearsAgo
  );

  const decayedRank = faceitEloToLevel(decayedElo);

  return {
    faceit_level: decayedRank,
    faceit_elo: decayedElo,
    faceit_kd: faceit_metadata?.faceit_kdr ?? FACEIT_DEFAULT_KD,
    faceit_date: new Date().getTime(),
    metadata: {
      faceit_matches_played: faceit_metadata?.faceit_matches_played,
      faceit_last_match:
        faceit_metadata?.faceit_last_match ?? lastMatchThreeYearsAgo,
      faceit_decay: decayedRank !== data.rank || decayedElo !== data.elo,
      faceit_fallback: false
    }
  } satisfies FaceITCSRank;
};

interface FaceITRankOptions {
  skipExternalCheck?: boolean;
}

/**
 * Used by signup to ensure that the rank is not old rank.
 * When skipExternalCheck is true: Redis then DB (season_id or latest season only); never calls FaceIT API; returns faceitErrorRank if no rank.
 */
export const getFaceITCS2Rank = async (
  steam_id: string,
  season_id?: number,
  options?: FaceITRankOptions
): Promise<FaceITCSRank> => {
  const skipExternalCheck = options?.skipExternalCheck === true;

  const tryDbRank = async (sid: number): Promise<FaceITCSRank | null> => {
    const rankFromDb = await getPlayerExternalRankForSeason(
      steam_id,
      sid,
      SeasonPlatform.FACEIT
    );
    if (
      rankFromDb &&
      rankFromDb.faceit_level != null &&
      rankFromDb.faceit_elo != null
    ) {
      return {
        faceit_level: rankFromDb.faceit_level,
        faceit_elo: rankFromDb.faceit_elo,
        faceit_kd: rankFromDb.faceit_kd ?? FACEIT_DEFAULT_KD,
        faceit_date: rankFromDb.faceit_date
          ? new Date(rankFromDb.faceit_date).getTime()
          : new Date().getTime(),
        metadata: {
          faceit_matches_played: undefined,
          faceit_last_match: undefined,
          faceit_decay: false
        }
      } satisfies FaceITCSRank;
    }
    return null;
  };

  if (season_id) {
    const dbRank = await tryDbRank(season_id);
    if (dbRank) return dbRank;
  }

  const redisKey = `730-${steam_id}-faceit-cs2-rank`;
  const fromRedis = await redisClient.get(redisKey);
  if (fromRedis) {
    logger.info(`[FaceIT] Using Redis cache for steam_id: ${steam_id}`);
    return JSON.parse(fromRedis) as FaceITCSRank;
  }

  if (skipExternalCheck) {
    const effectiveSeasonId =
      season_id ?? (await getLatestSeasonForPlayer(steam_id));
    if (effectiveSeasonId) {
      const dbRank = await tryDbRank(effectiveSeasonId);
      if (dbRank) return dbRank;
    }
    return faceitErrorRank;
  }

  try {
    const faceitRanks = await getFaceITGameRank(steam_id, "cs2");

    if (!faceitRanks) {
      const csgoFaceItRank = await getFaceITCSGORank(steam_id);

      if (!csgoFaceItRank.metadata.faceit_fallback) {
        await redisClient.set(
          redisKey,
          JSON.stringify(csgoFaceItRank),
          "EX",
          expireIn30Days
        );
      }
      return csgoFaceItRank;
    }

    const faceit_metadata = await getFaceITMetaData(
      faceitRanks.player_id,
      "cs2"
    );

    if (!faceit_metadata) {
      logger.warn(
        `[FaceIT] Failed to fetch CS2 metadata for player ${steam_id} - returning faceitErrorRank`
      );
      return faceitErrorRank;
    }

    const cs2FaceitEloDecayed = applyDecay(
      faceitRanks.elo,
      FACEIT_DEFAULT_ELO,
      faceit_metadata.faceit_last_match
    );
    const cs2FaceitRankDecayed = faceitEloToLevel(cs2FaceitEloDecayed);

    const returnData = {
      faceit_level: cs2FaceitRankDecayed,
      faceit_elo: cs2FaceitEloDecayed,
      faceit_kd: faceit_metadata.faceit_kdr,
      faceit_date: new Date().getTime(),
      metadata: {
        faceit_matches_played: faceit_metadata.faceit_matches_played,
        faceit_last_match: faceit_metadata.faceit_last_match,
        faceit_decay:
          faceitRanks.rank !== cs2FaceitRankDecayed ||
          faceitRanks.elo !== cs2FaceitEloDecayed
      }
    } satisfies FaceITCSRank;

    await redisClient.set(
      redisKey,
      JSON.stringify(returnData),
      "EX",
      expireIn30Days
    );

    return returnData;
  } catch (error) {
    logger.error(`[FaceIT] Error for steam_id: ${steam_id}`, error);
    return faceitErrorRank;
  }
};
