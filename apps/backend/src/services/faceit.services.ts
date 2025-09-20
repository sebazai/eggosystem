import {
  SeasonPlatform,
  type FaceITCSRank,
  type FaceITTeamDetails,
  type ChampionshipSubscription,
  type FaceitMatchesResponse,
  type FaceitMatch,
  type ChampionshipSubscriptionItem,
  type FaceitMatchStatsResponse,
  type FaceitPlayerDetails
} from "@eggosystem/types";
import {
  redisClient,
  expireIn30Days,
  expireInOneDay
} from "../utils/redisClient";
import { getPlayerExternalRankForSeason } from "../models/season-player-ranks.models";
import { logger } from "../utils/app-logger";
import { createAbortController } from "../utils/fetch-utils";
import {
  applyDecay,
  faceitEloToLevel,
  FACEIT_DEFAULT_ELO,
  FACEIT_DEFAULT_KD
} from "../utils/faceit-utils";
import { getMatchDateTime, adjustMatchDateTime } from "../utils/date-utils";
import {
  getMatchesByExternalId,
  updateMatchDateAndStartTime
} from "../models/match.models";
import { fetchAllItemsWithPagination } from "../utils/pagination-utils";
import { getActiveSeasonChampionshipIds } from "../models/season-league-external-id.models";

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
  // Check Redis cache first
  const redisKey = `faceit-player-${steam_id}-${game}`;
  const redisData = await redisClient.get(redisKey);
  if (redisData) {
    return JSON.parse(redisData) as FaceitPlayerDetails;
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

      // Player not found
      if (response.status === 404) {
        logger.warn(
          `[FaceIT] Player not found for steam_id: ${steam_id} (${duration}ms)`
        );
        return null;
      }

      throw new Error(
        `Failed to fetch Faceit player data: ${response.statusText}`
      );
    }

    const data: FaceitPlayerDetails = await response.json();
    clearAbortTimeout();

    // Fix the faceit_url by replacing {lang} placeholder with 'en'
    if (data.faceit_url) {
      logger.info(`[FaceIT] Original faceit_url: ${data.faceit_url}`);
      // Handle both {lang} and URL-encoded %7Blang%7D
      data.faceit_url = data.faceit_url
        .replace(/\{lang\}/g, "en")
        .replace(/%7Blang%7D/g, "en");
      logger.info(`[FaceIT] Fixed faceit_url: ${data.faceit_url}`);
    }

    // Cache the result in Redis
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
  // gameData is guaranteed to exist at this point
  const elo = Number(gameData?.faceit_elo || 0);
  const rank = Number(gameData?.skill_level || 0);
  const player_id = playerData.player_id;

  if (elo === 0 || rank === 0) {
    return null;
  }

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
    // gameData is guaranteed to exist at this point
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
  logger.info(
    `[FaceIT DEBUG] getFaceITMetaData called for faceit_player_id: ${faceit_player_id}, game: ${game}`
  );

  const { controller, clearAbortTimeout } =
    createAbortController("getFaceITMetaData");

  try {
    const stats_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/stats/${game}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      "User-Agent": "Kanaliiga-Eggosystem/1.0"
    };

    logger.info(`[FaceIT DEBUG] Fetching stats from: ${stats_url}`);
    const statsResponse = await fetch(stats_url, {
      headers,
      signal: controller.signal
    });
    const data = await statsResponse.json();
    logger.info(`[FaceIT DEBUG] Stats response data:`, data);

    const kdr = data["lifetime"]["Average K/D Ratio"];
    const matches_played = data["lifetime"]["Matches"];
    logger.info(
      `[FaceIT DEBUG] Raw kdr: ${kdr}, matches_played: ${matches_played}`
    );

    const game_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/games/${game}/stats`;
    logger.info(`[FaceIT DEBUG] Fetching games from: ${game_url}`);
    const gameResponse = await fetch(game_url, {
      headers,
      signal: controller.signal
    });
    const gameData = await gameResponse.json();
    logger.info(`[FaceIT DEBUG] Games response data:`, gameData);

    // In case we find a CS2 FaceIT rank, but no metadata, this means the player has a FaceIT CS2 rank,
    // but has not played any CS2 games. We check if there are CSGO games, get the latest match, and apply decay.
    if (game === "cs2" && gameData.items.length === 0) {
      // Return metadata
      return getFaceITMetaData(faceit_player_id, "csgo");
    }

    const last_match = new Date(
      gameData.items[0]["stats"]["Created At"]
    ).getTime();

    clearAbortTimeout();

    const numKdr = Number(kdr);
    const numMatchesPlayed = Number(matches_played);
    logger.info(
      `[FaceIT DEBUG] Converted kdr: ${numKdr}, matches_played: ${numMatchesPlayed}`
    );
    logger.info(
      `[FaceIT DEBUG] isNaN(kdr): ${isNaN(numKdr)}, isNaN(matches_played): ${isNaN(numMatchesPlayed)}`
    );

    if (isNaN(numKdr) || isNaN(numMatchesPlayed)) {
      logger.warn(
        `[FaceIT DEBUG] NaN detected - returning null for faceit_player_id: ${faceit_player_id}`
      );
      return null;
    }

    const result = {
      faceit_kdr: Number(kdr),
      faceit_matches_played: Number(matches_played),
      faceit_last_match: last_match
    };
    logger.info(`[FaceIT DEBUG] Returning metadata result:`, result);
    return result;
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
  logger.info(
    `[FaceIT DEBUG] getFaceITCSGORank called for steam_id: ${steam_id}`
  );

  const data = await getFaceITGameRank(steam_id, "csgo");
  logger.info(`[FaceIT DEBUG] CSGO game rank data:`, data);

  if (!data) {
    logger.warn(
      `[FaceIT] Failed to fetch CSGO rank for player ${steam_id} - returning fallbackFaceITRank`
    );
    return fallbackFaceITRank;
  }

  const faceit_metadata = await getFaceITMetaData(data.player_id, "csgo");
  logger.info(`[FaceIT DEBUG] CSGO metadata:`, faceit_metadata);

  const lastMatchThreeYearsAgo =
    new Date().getTime() - 3 * 365 * 24 * 60 * 60 * 1000;

  const decayedElo = applyDecay(
    data.elo,
    FACEIT_DEFAULT_ELO,
    faceit_metadata?.faceit_last_match ?? lastMatchThreeYearsAgo
  );

  const decayedRank = faceitEloToLevel(decayedElo);

  const returnData = {
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

  logger.info(`[FaceIT DEBUG] CSGO return data:`, returnData);
  return returnData;
};

/**
 * Used by signup to ensure that the rank is not old rank
 * @param steam_id
 * @param season_id
 * @returns
 */
export const getFaceITCS2Rank = async (
  steam_id: string,
  season_id?: number
): Promise<FaceITCSRank> => {
  logger.info(
    `[FaceIT DEBUG] getFaceITCS2Rank called for steam_id: ${steam_id}, season_id: ${season_id}`
  );

  // If someone added the rank to database for season, we use that one
  if (season_id) {
    const rankFromDb = await getPlayerExternalRankForSeason(
      steam_id,
      season_id,
      SeasonPlatform.FACEIT
    );
    // Ensure that the rank is in database
    if (rankFromDb && rankFromDb.faceit_level && rankFromDb.faceit_elo) {
      logger.info(
        `[FaceIT DEBUG] Using database rank for steam_id: ${steam_id}`
      );
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
  }

  const redisKey = `730-${steam_id}-faceit-cs2-rank`;
  const fromRedis = await redisClient.get(redisKey);
  if (fromRedis) {
    logger.info(`[FaceIT DEBUG] Using Redis cache for steam_id: ${steam_id}`);
    return JSON.parse(fromRedis) as FaceITCSRank;
  }

  try {
    logger.info(
      `[FaceIT DEBUG] Calling getFaceITGameRank for steam_id: ${steam_id}`
    );
    const faceitRanks = await getFaceITGameRank(steam_id, "cs2");
    logger.info(
      `[FaceIT DEBUG] getFaceITGameRank result for steam_id: ${steam_id}:`,
      faceitRanks
    );

    if (!faceitRanks) {
      logger.info(
        `[FaceIT DEBUG] No CS2 rank found, falling back to CSGO for steam_id: ${steam_id}`
      );
      // Fallback to CSGO rank
      const csgoFaceItRank = await getFaceITCSGORank(steam_id);
      logger.info(
        `[FaceIT DEBUG] CSGO fallback rank for steam_id: ${steam_id}:`,
        csgoFaceItRank
      );

      // Set non-fallback rank to redis
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

    logger.info(
      `[FaceIT DEBUG] Calling getFaceITMetaData for player_id: ${faceitRanks.player_id}`
    );
    const faceit_metadata = await getFaceITMetaData(
      faceitRanks.player_id,
      "cs2"
    );
    logger.info(
      `[FaceIT DEBUG] getFaceITMetaData result for player_id: ${faceitRanks.player_id}:`,
      faceit_metadata
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

export const getFaceITTeamDetails = async (faceit_team_id: string) => {
  const redisKey = `faceit-team-${faceit_team_id}`;
  const redisData = await redisClient.get(redisKey);
  if (redisData) {
    return JSON.parse(redisData) as FaceITTeamDetails;
  }
  const webURL = `https://open.faceit.com/data/v4/teams/${faceit_team_id}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  if (!response.ok) {
    return undefined;
  }
  const data: FaceITTeamDetails = await response.json();
  await redisClient.set(redisKey, JSON.stringify(data), "EX", expireInOneDay);
  return data;
};

export const getFaceITMatchDetails = async <T>(match_id: string) => {
  const webURL = `https://open.faceit.com/data/v4/matches/${match_id}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  return response.json() as Promise<T>;
};

/**
 * Gets player details from Faceit API by steam_id
 * @param steam_id The Steam ID of the player
 * @returns Player details from Faceit or null if not found
 */
export const getFaceitPlayerDetailsBySteamId = async (
  steam_id: string
): Promise<FaceitPlayerDetails | null> => {
  // Simply delegate to the base function with cs2 as the game
  return fetchFaceitPlayerData(steam_id, "cs2");
};

export const getFaceITChampionshipDetails = async <T>(
  championship_id: string
) => {
  const webURL = `https://open.faceit.com/data/v4/championships/${championship_id}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  return response.json() as Promise<T>;
};

export const getFaceITChampionshipSubscriptions = async (
  championship_id: string,
  offset: number = 0,
  limit: number = 10
) => {
  const webURL = `https://open.faceit.com/data/v4/championships/${championship_id}/subscriptions?offset=${offset}&limit=${limit}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  return response.json() as Promise<ChampionshipSubscription>;
};

/**
 * Fetches ALL championship subscriptions by automatically handling pagination
 * Returns the same data structure but with all items combined
 */
export const getAllFaceITChampionshipSubscriptions = async (
  championship_id: string
): Promise<ChampionshipSubscription> => {
  // Get the first response to understand the structure
  const firstResponse = await getFaceITChampionshipSubscriptions(
    championship_id,
    0,
    10
  );

  // If we got all items in the first call, return as is
  if (firstResponse.items.length < 10) {
    return firstResponse;
  }

  // Otherwise, fetch all remaining items starting from the next page
  // We already have the first page items, so start from offset 10
  const remainingItems = await fetchAllItemsWithPagination<
    ChampionshipSubscription,
    ChampionshipSubscriptionItem
  >(
    (offset: number, limit: number) =>
      getFaceITChampionshipSubscriptions(championship_id, offset, limit),
    "items",
    10,
    10 // Start from offset 10 since we already have the first page
  );

  // Combine first page items with remaining items
  const allItems = [...firstResponse.items, ...remainingItems];

  return {
    ...firstResponse,
    items: allItems,
    start: 0,
    end: allItems.length
  };
};

export const getDemoDownloadUrl = async (matchGameDemoUrl: string) => {
  const demoAPI = "https://open.faceit.com/download/v2/demos/download";
  const demoHeaders = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };

  const response = await fetch(demoAPI, {
    method: "POST",
    headers: demoHeaders,
    body: JSON.stringify({
      resource_url: matchGameDemoUrl
    })
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get demo download URL: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.payload.download_url; // Return download URL from response
};

export const fetchFaceitChampionshipUpcomingMatches = async (
  championshipId: string
) => {
  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const response = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches?type=upcoming`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `FACEIT API error for championship ${championshipId}: ${response.status} ${response.statusText}`
    );
  }

  const data: FaceitMatchesResponse = await response.json();

  return data.items;
};

export const syncMatchSchedule = async (
  faceitMatch: FaceitMatch,
  isBO2PlayedAs2xBO1: boolean
): Promise<void> => {
  const databaseMatches = await getMatchesByExternalId(faceitMatch.match_id);

  if (databaseMatches.length === 0) {
    logger.warn(
      `No database matches found for external_match_room_id: ${faceitMatch.match_id}`
    );
    return;
  }

  // Convert FACEIT scheduled_at (Unix timestamp) to match_date and start_time
  const faceitSchedule = getMatchDateTime(faceitMatch.scheduled_at);

  const firstMatch = databaseMatches[0];
  const first_match_date = firstMatch.match_date;
  const first_match_time = firstMatch.start_time;
  if (
    first_match_date === faceitSchedule.match_date &&
    first_match_time === faceitSchedule.start_time
  ) {
    return;
  }

  logger.info(
    `[FACEIT] New time for match ${faceitMatch.match_id} ${faceitSchedule.match_date} ${faceitSchedule.start_time}`
  );

  if (isBO2PlayedAs2xBO1 && databaseMatches.length === 2) {
    // Handle BO2 matches stored as 2 BO1 matches
    // First match gets the FACEIT schedule
    const firstMatch = databaseMatches[0];
    await updateMatchDateAndStartTime(
      firstMatch.id,
      faceitSchedule.match_date,
      faceitSchedule.start_time
    );

    // Second match gets +1 hour from the first match
    const secondMatchSchedule = adjustMatchDateTime(
      faceitSchedule.match_date,
      faceitSchedule.start_time,
      { hours: 1 }
    );
    await updateMatchDateAndStartTime(
      databaseMatches[1].id,
      secondMatchSchedule.match_date,
      secondMatchSchedule.start_time
    );

    logger.info(
      `Updated BO2 match schedules: First match at ${faceitSchedule.match_date} ${faceitSchedule.start_time}, Second match at ${secondMatchSchedule.match_date} ${secondMatchSchedule.start_time}`
    );
  } else {
    await updateMatchDateAndStartTime(
      databaseMatches[0].id,
      faceitSchedule.match_date,
      faceitSchedule.start_time
    );

    logger.info(
      `Updated single match ${databaseMatches[0].id} schedule: ${faceitSchedule.match_date} ${faceitSchedule.start_time}`
    );
  }
};

export const syncAllFaceitChampionshipMatches = async (): Promise<void> => {
  logger.info("Starting FACEIT championship match sync...");

  // Get all active season championship IDs
  const championshipIds = await getActiveSeasonChampionshipIds();
  logger.info(
    `Found ${championshipIds.length} active season championships to sync`
  );

  if (championshipIds.length === 0) {
    logger.info("No active season championships found. Sync completed.");
    return;
  }

  for (const championship of championshipIds) {
    logger.info(`Syncing championship: ${championship.external_id}`);

    // Fetch matches from FACEIT API
    const faceitMatches = await fetchFaceitChampionshipUpcomingMatches(
      championship.external_id
    );
    logger.info(
      `Found ${faceitMatches.length} upcoming matches in FACEIT for championship ${championship.external_id}`
    );

    // Sync each match
    for (const faceitMatch of faceitMatches) {
      try {
        await syncMatchSchedule(faceitMatch, championship.isBO2PlayedAs2xBO1);
      } catch (error) {
        logger.error(`Error syncing match ${faceitMatch.match_id}:`, error);
      }
    }
  }

  logger.info(`FACEIT championship match sync completed.`);
};

export const getFaceitMatchStats = async (match_id: string) => {
  if (!process.env.FACEIT_API_KEY) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const redisKey = `faceit-match-stats-${match_id}`;
  const cached = await redisClient.get(redisKey);
  if (cached) {
    return JSON.parse(cached) as FaceitMatchStatsResponse;
  }

  const webURL = `https://open.faceit.com/data/v4/matches/${match_id}/stats`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  if (!response.ok) {
    throw new Error(
      `Faceit API returned ${response.status}: ${response.statusText}`
    );
  }
  const data: FaceitMatchStatsResponse = await response.json();
  await redisClient.set(redisKey, JSON.stringify(data), "EX", expireIn30Days);
  return data;
};
