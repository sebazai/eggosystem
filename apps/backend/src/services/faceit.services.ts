import {
  SeasonPlatform,
  type FaceITCSRank,
  type FaceITTeamDetails,
  type ChampionshipSubscription,
  type FaceitMatchesResponse,
  type FaceitMatch,
  type ChampionshipSubscriptionItem,
  type FaceitMatchStatsResponse,
  type FaceitPlayerDetails,
  type MatchDemoReadyWebhook,
  type ChampionshipDetailsDemoReady,
  MatchStatus
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
  getFaceitMatchDateTime,
  adjustMatchDateTime
} from "../utils/date-utils";
import {
  getHubMatchesByExternalMatchRoomId,
  getMatch,
  getMatchesByExternalId,
  updateMatchStartAndEndTimestamp,
  updateMatchStatusByMatchId
} from "../models/match.models";
import { fetchAllItemsWithPagination } from "../utils/pagination-utils";
import {
  getActiveSeasonChampionshipIds,
  getSeasonChampionshipIds
} from "../models/season-league-external-id.models";
import { getReservationsWithEmailForMatch } from "../models/match-streams.models";
import { sendMatchScheduleChangeEmail } from "./email.services";
import { runQuery } from "../db/mysqlRunQuery";
import {
  getPlayerByFaceitId,
  updateSteamPlayerFaceitData
} from "../models/player.models";
import {
  getRateLimitForService,
  setRateLimitForService
} from "../utils/rate-limit-utils";
import {
  getMatchGameByDemoUrl,
  upsertMatchGameForMatch
} from "../models/match-game.models";
import { parseFaceitDemoUrl } from "../utils/faceit-demo-url-parser";
import { getConnection } from "../db/mysqlConnection";
import { getMatchPickedMapsOrderedByVetoOrder } from "../models/match-team-map-veto.models";

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

      // Player not found
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

    if (isNaN(numKdr) || isNaN(numMatchesPlayed)) {
      logger.warn(
        `[FaceIT] NaN detected - returning null for faceit_player_id: ${faceit_player_id}`
      );
      return null;
    }

    const result = {
      faceit_kdr: Number(kdr),
      faceit_matches_played: Number(matches_played),
      faceit_last_match: last_match
    };
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

  return returnData;
};

interface FaceITRankOptions {
  skipExternalCheck?: boolean;
}

/**
 * Used by signup to ensure that the rank is not old rank
 * When skipExternalCheck is true: Redis then DB (season_id or latest season only); never calls FaceIT API; returns faceitErrorRank if no rank.
 * @param steam_id
 * @param season_id
 * @param options
 * @returns
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

  // If someone added the rank to database for season, we use that one
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
      // Fallback to CSGO rank
      const csgoFaceItRank = await getFaceITCSGORank(steam_id);

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
 * Gets player details from Faceit API by FaceIt user_id (player_id)
 * @param faceit_user_id The FaceIt user ID of the player
 * @returns Player details from Faceit or null if not found
 */
const getFaceitPlayerDetails = async (
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

      // Player not found
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

    // Fix the faceit_url by replacing {lang} placeholder with 'en'
    if (data.faceit_url) {
      data.faceit_url = data.faceit_url
        .replace(/\{lang\}/g, "en")
        .replace(/%7Blang%7D/g, "en");
    }

    // Cache the result in Redis
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

const getFaceITChampionshipSubscriptions = async (
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

interface ChampionshipTeamMember {
  faceit_user_id: string;
  nickname: string;
  steam_id: string | null;
}

interface ChampionshipTeamWithMembers {
  team_id: string;
  team_name: string;
  members: ChampionshipTeamMember[];
}

/**
 * Fetches all teams in a championship with full member details including Steam IDs
 * @param championship_id The FaceIt championship ID
 * @returns Array of teams with member details
 */
export const getChampionshipTeamsWithMembers = async (
  championship_id: string
): Promise<ChampionshipTeamWithMembers[]> => {
  logger.info(
    `[FaceIT] Fetching championship teams with members for championship: ${championship_id}`
  );

  const subscriptions =
    await getAllFaceITChampionshipSubscriptions(championship_id);

  const teams = await Promise.all(
    subscriptions.items.map(async (subscription) => {
      logger.info(
        `[FaceIT] Processing team: ${subscription.team.name} with ${subscription.team.members.length} members`
      );

      // Get player details for each team member concurrently
      const teamMembers = await Promise.all(
        subscription.team.members.map(async (member) => {
          // First check database for existing player data
          const dbPlayer = await getPlayerByFaceitId(member.user_id);

          if (dbPlayer) {
            // Update faceit_nickname if it differs from member.nickname
            if (
              member.nickname !== dbPlayer.faceit_nickname &&
              dbPlayer.steam_id
            ) {
              await updateSteamPlayerFaceitData(
                dbPlayer.steam_id,
                member.nickname,
                member.user_id
              );
              logger.info(
                `[FaceIT] Updated faceit_nickname for ${dbPlayer.steam_id}: ${dbPlayer.faceit_nickname} -> ${member.nickname}`
              );
            }

            logger.info(
              `[FaceIT] ✅ Found player in database: ${member.nickname || dbPlayer.faceit_nickname || dbPlayer.nickname} (Steam ID: ${dbPlayer.steam_id})`
            );
            return {
              faceit_user_id: member.user_id,
              nickname:
                member.nickname ||
                dbPlayer.faceit_nickname ||
                dbPlayer.nickname,
              steam_id: dbPlayer.steam_id ? String(dbPlayer.steam_id) : null
            };
          }

          // Fall back to API if not found in database
          const playerDetails = await getFaceitPlayerDetails(member.user_id);

          if (playerDetails && playerDetails?.games?.cs2) {
            logger.info(
              `[FaceIT] ✅ Got player details from API: ${playerDetails.nickname} (Steam ID: ${playerDetails.games.cs2.game_player_id})`
            );
            return {
              faceit_user_id: member.user_id,
              nickname: playerDetails.nickname,
              steam_id: playerDetails.games.cs2.game_player_id || null
            };
          } else {
            logger.warn(
              `[FaceIT] ❌ Failed to get CS2 Steam ID for: ${member.nickname} (${member.user_id})`
            );
            return {
              faceit_user_id: member.user_id,
              nickname: member.nickname,
              steam_id: null
            };
          }
        })
      );

      logger.info(
        `[FaceIT] Team ${subscription.team.name} final member count: ${teamMembers.length}/${subscription.team.members.length}`
      );

      return {
        team_id: subscription.team.team_id,
        team_name: subscription.team.name,
        members: teamMembers
      };
    })
  );

  return teams;
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

const fetchFaceitChampionshipUpcomingMatches = async (
  championshipId: string
) => {
  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const response = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches?type=upcoming&limit=100`,
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

const syncMatchSchedule = async (
  faceitMatch: FaceitMatch,
  is_round_robin_bo2_as_2xbo1: boolean
): Promise<void> => {
  const notifyOfMatches: {
    matchId: number;
    oldTimestamp: string;
    newTimestamp: string;
  }[] = [];
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const databaseMatches = await getMatchesByExternalId(
      faceitMatch.match_id,
      connection
    );

    if (databaseMatches.length === 0) {
      logger.warn(
        `No database matches found for external_match_room_id: ${faceitMatch.match_id}`
      );
      return;
    }

    // Convert FACEIT scheduled_at (Unix timestamp in seconds) to UTC ISO string
    // FACEIT timestamps are Unix seconds since epoch (UTC)
    const faceitScheduleTimestamp = getFaceitMatchDateTime(
      faceitMatch.scheduled_at
    );

    const firstMatch = databaseMatches[0];
    // Convert database timestamp to ISO string for comparison
    const firstMatchTimestamp = new Date(
      firstMatch.start_timestamp
    ).toISOString();

    if (is_round_robin_bo2_as_2xbo1 && databaseMatches.length === 2) {
      const secondMatch = databaseMatches[1];
      const secondMatchTimestamp = new Date(
        secondMatch.start_timestamp
      ).toISOString();

      const faceitSecondAssumedScheduledTimestamp = adjustMatchDateTime(
        faceitScheduleTimestamp,
        { hours: 1 }
      );

      const isForfeitInDb =
        firstMatch.status === MatchStatus.FORFEIT ||
        secondMatch.status === MatchStatus.FORFEIT;

      if (
        firstMatchTimestamp === faceitScheduleTimestamp &&
        secondMatchTimestamp === faceitSecondAssumedScheduledTimestamp &&
        !isForfeitInDb
      ) {
        return;
      }

      logger.info(
        `[FACEIT] New time for match ${faceitMatch.match_id}: new ${faceitScheduleTimestamp} or ${faceitSecondAssumedScheduledTimestamp} vs. old ${firstMatchTimestamp} or ${secondMatchTimestamp} (2xBO1 as BO2)`
      );

      // Handle BO2 matches stored as 2 BO1 matches
      // First match gets the FACEIT schedule
      await updateMatchStartAndEndTimestamp(
        databaseMatches[0].id,
        faceitScheduleTimestamp,
        null,
        connection
      );

      await updateMatchStatusByMatchId(
        databaseMatches[0].id,
        "SCHEDULED",
        connection
      );

      notifyOfMatches.push({
        matchId: databaseMatches[0].id,
        oldTimestamp: firstMatchTimestamp,
        newTimestamp: faceitScheduleTimestamp
      });

      // Second match gets +1 hour from the first match
      const secondMatchScheduleTimestamp = adjustMatchDateTime(
        faceitScheduleTimestamp,
        { hours: 1 }
      );

      await updateMatchStartAndEndTimestamp(
        databaseMatches[1].id,
        secondMatchScheduleTimestamp,
        null,
        connection
      );

      await updateMatchStatusByMatchId(
        databaseMatches[1].id,
        "SCHEDULED",
        connection
      );

      notifyOfMatches.push({
        matchId: databaseMatches[1].id,
        oldTimestamp: secondMatchTimestamp,
        newTimestamp: secondMatchScheduleTimestamp
      });

      logger.info(
        `Updated BO2 match schedules: First match at ${faceitScheduleTimestamp}, Second match at ${secondMatchScheduleTimestamp}`
      );
    } else {
      if (firstMatchTimestamp === faceitScheduleTimestamp) {
        return;
      }

      logger.info(
        `[FACEIT] New time for match ${faceitMatch.match_id}: new ${faceitScheduleTimestamp} vs. old ${firstMatchTimestamp}`
      );

      await updateMatchStartAndEndTimestamp(
        databaseMatches[0].id,
        faceitScheduleTimestamp,
        null,
        connection
      );

      await updateMatchStatusByMatchId(
        databaseMatches[0].id,
        "SCHEDULED",
        connection
      );

      // Notify reservations
      notifyOfMatches.push({
        matchId: databaseMatches[0].id,
        oldTimestamp: firstMatchTimestamp,
        newTimestamp: faceitScheduleTimestamp
      });

      logger.info(
        `Updated single match ${databaseMatches[0].id} schedule: ${faceitScheduleTimestamp}`
      );
    }
    await connection.commit();
  } catch (error) {
    logger.error(`Error syncing match ${faceitMatch.match_id}:`, error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    notifyOfMatches.forEach((match) => {
      if (match.oldTimestamp === match.newTimestamp) {
        return;
      }
      logger.info(
        `Notifying reservations of schedule change for match ${match.matchId}: ${match.oldTimestamp} -> ${match.newTimestamp}`
      );
      void notifyReservationsOfScheduleChange(
        match.matchId,
        match.oldTimestamp,
        match.newTimestamp
      );
    });
  }
};

/**
 * Notifies casters with reservations when a match schedule changes
 * @param matchId - The match ID
 * @param oldTimestamp - ISO 8601 timestamp string (UTC) for the old schedule
 * @param newTimestamp - ISO 8601 timestamp string (UTC) for the new schedule
 */
const notifyReservationsOfScheduleChange = async (
  matchId: number,
  oldTimestamp: string,
  newTimestamp: string
): Promise<void> => {
  try {
    // Get all reservations for this match with caster emails
    const reservations = await getReservationsWithEmailForMatch(matchId);

    if (reservations.length === 0) {
      logger.debug(`No reservations found for match ${matchId}`);
      return;
    }

    // Get team names and match links for the match
    const teamNames = await getMatchTeamNames(matchId);
    const [matchRow] = await getMatch(matchId);
    const matchPageUrl = `${process.env.FRONTEND_URL}/matches/${matchId}`;
    const matchroomUrl = matchRow?.external_match_room_id
      ? `https://www.faceit.com/en/cs2/room/${matchRow.external_match_room_id}`
      : null;

    // Send email to each caster
    for (const reservation of reservations) {
      if (!reservation.work_email) {
        logger.warn(
          `No email found for reservation ${reservation.id}, skipping notification`
        );
        continue;
      }

      try {
        await sendMatchScheduleChangeEmail(reservation.work_email, {
          teamNames,
          oldTimestamp,
          newTimestamp,
          reservationHash: reservation.hash,
          matchPageUrl,
          matchroomUrl
        });

        logger.info(
          `Sent schedule change notification to ${reservation.work_email} for match ${matchId}`
        );
      } catch (emailError) {
        logger.error(
          `Failed to send schedule change email to ${reservation.work_email}:`,
          emailError
        );
      }
    }
  } catch (error) {
    logger.error(`Error notifying reservations for match ${matchId}:`, error);
  }
};

/**
 * Gets team names for a match in "Team A vs Team B" format
 */
const getMatchTeamNames = async (matchId: number): Promise<string> => {
  const teams = await runQuery<Array<{ name: string }>>(
    `SELECT t.name 
     FROM Teams t
     JOIN MatchTeams mt ON t.id = mt.team_id
     WHERE mt.match_id = ?
     ORDER BY t.name`,
    [matchId]
  );

  if (teams.length === 0) {
    return "Unknown Teams";
  }

  if (teams.length === 1) {
    return teams[0].name;
  }

  return `${teams[0].name} vs ${teams[1].name}`;
};

export const syncFaceitChampionshipMatches = async (
  season_id?: number
): Promise<void> => {
  logger.info("Starting FACEIT championship match sync...");

  // Get all active season championship IDs
  const championshipIds = season_id
    ? await getSeasonChampionshipIds(season_id)
    : await getActiveSeasonChampionshipIds();
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
        await syncMatchSchedule(
          faceitMatch,
          championship.is_round_robin_bo2_as_2xbo1
        );
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
  const best_of_regular = data.rounds.length.toString();
  if (data.rounds && data.rounds.some((r) => r.best_of === best_of_regular)) {
    await redisClient.set(redisKey, JSON.stringify(data), "EX", expireInOneDay);
  }
  return data;
};

export const addFaceitMatchGameToDatabase = async (
  webhookData: MatchDemoReadyWebhook,
  matchDetails: ChampionshipDetailsDemoReady,
  isRoundRobinBo2As2xBo1: boolean = false
) => {
  const { demo_url } = webhookData.payload;

  const gameWithDemo = await getMatchGameByDemoUrl(demo_url);

  if (gameWithDemo) {
    return gameWithDemo.id;
  }

  const parsedDemoUrl = parseFaceitDemoUrl(demo_url);
  if (!parsedDemoUrl) {
    throw new Error(`Invalid faceit demo url: ${demo_url}`);
  }

  const { match_id: faceit_match_id } = matchDetails;

  // We can have multiple matches for the same faceit external match room id, so we need to get all of them
  const matches = await getHubMatchesByExternalMatchRoomId(faceit_match_id);

  if (!matches || matches.length === 0) {
    throw new Error(
      `No matches found when adding match games with match_id: ${faceit_match_id}`
    );
  }

  const match = matches[0];

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const mapPlayedNumber = parsedDemoUrl.mapNumber;
    // We have the same map picks/bans for all matches in a 2xBO1, so we can get the vetoes from the first match
    const matchMapVetoes = await getMatchPickedMapsOrderedByVetoOrder(
      match.id,
      connection
    );
    const mapPlayedVoteObject = matchMapVetoes[mapPlayedNumber - 1];

    if (
      isRoundRobinBo2As2xBo1 &&
      matchDetails.best_of === 2 &&
      matches.length === 2
    ) {
      // We should receive 2 picks, as both 2xBO1 matches have the same picks.
      if (matchMapVetoes.length !== 2) {
        throw new Error("Something is very wrong with this 2xBO1");
      }

      const matchObject = matches[mapPlayedNumber - 1];
      if (!matchObject) {
        throw new Error("Could not find match object for 2xBO1 matches");
      }

      const insertedRow = await upsertMatchGameForMatch({
        match_id: matchObject.id,
        map_id: mapPlayedVoteObject.map_id,
        map_order: mapPlayedNumber,
        demo_file: demo_url,
        connection
      });
      await connection.commit();

      return insertedRow.insertId;
    }

    if (!mapPlayedVoteObject) {
      logger.error(
        `Could not find map played vote object for match ${faceit_match_id}, map played in: ${mapPlayedNumber - 1}, matchMapVetoes: ${JSON.stringify(matchMapVetoes)}`
      );
      throw new Error(
        `Could not find map played vote object for match_id: ${faceit_match_id}`
      );
    }

    const insertedRow = await upsertMatchGameForMatch({
      match_id: match.id,
      map_id: mapPlayedVoteObject.map_id,
      map_order: mapPlayedNumber,
      demo_file: demo_url,
      connection
    });

    await connection.commit();
    return insertedRow.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
