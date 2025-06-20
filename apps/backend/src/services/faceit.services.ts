import {
  SeasonPlatform,
  type FaceITCSRank,
  type FaceITTeamDetails
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
  faceitLevelDefaultElo
} from "../utils/faceit-utils";

// E2E Test mode mocking
const isE2EMode =
  process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e";

export const getFaceITGameRank = async (
  steam_id: string,
  game: "cs2" | "csgo"
) => {
  // E2E Mock: Return mock FACEIT rank data
  if (isE2EMode) {
    // Special case for our test player without FaceIT rank
    if (steam_id === "66561198999999913") {
      return null;
    }

    return {
      elo: 1850,
      rank: 7,
      player_id: `faceit-player-${steam_id}`
    };
  }

  const { controller, clearAbortTimeout } =
    createAbortController("getFaceITGameRank");

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
      // Player not found rank for CS2 nor csgo, we return null and fallback to default rank
      if (response.status === 404) {
        logger.warn(
          `[FaceIT] Player not found for steam_id: ${steam_id} (${duration}ms)`
        );
        return null;
      }

      throw new Error("Failed to fetch FaceIT rank");
    }

    const data = await response.json();
    const elo = Number(data["games"][game]["faceit_elo"]);
    const rank = Number(data["games"][game]["skill_level"]);
    const player_id = data["player_id"];

    clearAbortTimeout();

    if (Number.isNaN(elo) || Number.isNaN(rank)) {
      logger.warn(`[FaceIT] Invalid rank data for steam_id: ${steam_id}`, data);
      throw new Error("Invalid rank data");
    }

    return {
      elo,
      rank,
      player_id
    };
  } catch (error) {
    clearAbortTimeout();
    logger.error(`[FaceIT] Error for steam_id: ${steam_id}`, error);
    throw error;
  }
};

const getFaceITMetaData = async (
  faceit_player_id: string,
  game: "cs2" | "csgo" = "cs2"
) => {
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
    const last_match = new Date(
      gameData.items[0]["stats"]["Created At"]
    ).getTime();

    clearAbortTimeout();

    const numKdr = Number(kdr);
    const numMatchesPlayed = Number(matches_played);
    if (isNaN(numKdr) || isNaN(numMatchesPlayed)) {
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
  faceit_elo: faceitLevelDefaultElo,
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
    logger.warn(`[FaceIT] Failed to fetch CSGO rank for player ${steam_id}`);
    return fallbackFaceITRank;
  }

  const faceit_metadata = await getFaceITMetaData(data.player_id, "csgo");

  const lastMatchThreeYearsAgo =
    new Date().getTime() - 3 * 365 * 24 * 60 * 60 * 1000;

  const decayedElo = applyDecay(
    data.elo,
    faceitLevelDefaultElo,
    faceit_metadata?.faceit_last_match ?? lastMatchThreeYearsAgo
  );

  const decayedRank = faceitEloToLevel(decayedElo);

  const returnData = {
    faceit_level: decayedRank,
    faceit_elo: decayedElo,
    faceit_kd: faceit_metadata?.faceit_kdr ?? 0.95,
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

/**
 * Used by signup to ensure that the rank is not old rank
 * @param steam_id
 * @param season_id
 * @returns
 */
export const getFaceITCS2Rank = async (
  steam_id: string,
  season_id?: number
) => {
  // If someone added the rank to database for season, we use that one
  if (season_id) {
    const rankFromDb = await getPlayerExternalRankForSeason(
      steam_id,
      season_id,
      SeasonPlatform.FACEIT
    );
    // Ensure that the rank is in database
    if (rankFromDb && rankFromDb.faceit_level && rankFromDb.faceit_elo) {
      return {
        faceit_level: rankFromDb.faceit_level,
        faceit_elo: rankFromDb.faceit_elo,
        faceit_kd: rankFromDb.faceit_kd ?? 0.95,
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
    return JSON.parse(fromRedis) as FaceITCSRank;
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
        `[FaceIT] Failed to fetch CS2 metadata for player ${steam_id}`
      );
      return faceitErrorRank;
    }

    const cs2FaceitEloDecayed = applyDecay(
      faceitRanks.elo,
      faceitLevelDefaultElo,
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
  // E2E Mock: Return mock FACEIT team data
  if (isE2EMode) {
    return {
      team_id: faceit_team_id,
      name: "E2E Test FACEIT Team",
      avatar: "https://example.com/avatar.jpg",
      game: "cs2",
      nickname: "",
      team_type: "",
      members: [],
      leader: "",
      chat_room_id: "",
      faceit_url: `https://www.faceit.com/en/teams/${faceit_team_id}`
    } as FaceITTeamDetails;
  }

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
