import {
  type Nullable,
  type SeasonPlayerRank,
  type FaceITCSRank,
  SeasonPlatform
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import _ from "lodash";
import { redisClient } from "../utils/redisClient";
import {
  getPlayerHoursForSeason,
  getPlayerRankForSeason
} from "../models/seasonplayerranks.models";

const isMatchmakingRank = (game: GameRanks): game is MatchmakingRankType =>
  game.dataSource === "matchmaking";

const convertCSGORankToCS2 = (csgo_rank: number) => {
  if (csgo_rank < 7) return { rank: 1000 + 166 * csgo_rank };
  if (csgo_rank < 11) return { rank: 2000 + 999 * (csgo_rank - 6) };
  if (csgo_rank < 14) return { rank: 6000 + 1000 * (csgo_rank - 10) };
  if (csgo_rank < 17) return { rank: 9000 + 1250 * (csgo_rank - 13) };
  if (csgo_rank === 17) return { rank: 13450 };
  return { rank: 15000 };
};

// Ranktypes
// 11 = premier
// 12 = map based comp

interface MatchmakingRankType {
  dataSource: "matchmaking";
  rankType: Nullable<number>;
  skillLevel: number;
  isCs2: boolean;
}

interface FaceITRankType {
  dataSource: "faceit";
  rankType: null;
  skillLevel: null;
  elo: number;
  isCs2: boolean;
}

type GameRanks = MatchmakingRankType | FaceITRankType;

interface LeetifyResponse {
  games: Array<GameRanks>;
}

const getCS2RankFromLeetify = async (steam_id: string) => {
  const webURL = "https://api.cs-prod.leetify.com/api/profile/id/" + steam_id;

  const result = await fetch(webURL);
  if (!result.ok) {
    return undefined;
  }
  const data: LeetifyResponse = await result.json();

  const firstMatchmakingGame = data.games.find(
    (g): g is MatchmakingRankType =>
      isMatchmakingRank(g) && g.rankType === 11 && g.isCs2 && g.skillLevel > 0
  );
  if (firstMatchmakingGame) {
    return { rank: firstMatchmakingGame.skillLevel };
  }

  const firstCSGOGame = data.games.find(
    (g): g is MatchmakingRankType =>
      isMatchmakingRank(g) && !g.isCs2 && g.skillLevel > 0
  );
  if (firstCSGOGame) {
    return convertCSGORankToCS2(firstCSGOGame.skillLevel);
  }

  return undefined;
};

const getFaceITMetaData = async (
  faceit_player_id: string,
  game: "cs2" | "csgo" = "cs2"
) => {
  try {
    const stats_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/stats/${game}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
    };
    const statsResponse = await fetch(stats_url, { headers });
    const data = await statsResponse.json();

    const kdr = data["lifetime"]["Average K/D Ratio"];
    const matches_played = data["lifetime"]["Matches"];

    const game_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/games/${game}/stats`;
    const gameResponse = await fetch(game_url, { headers });
    const gameData = await gameResponse.json();
    const last_match = new Date(
      gameData.items[0]["stats"]["Created At"]
    ).getTime();

    return {
      faceit_kdr: Number(kdr),
      faceit_matches_played: Number(matches_played),
      faceit_last_match: last_match
    };
  } catch (_err) {
    // NO-OP
    return {
      faceit_kdr: 1 / 1.05
    };
  }
};

const getFaceITGameRank = async (steam_id: string, game: "cs2" | "csgo") => {
  try {
    const webURL = `https://open.faceit.com/data/v4/players?game=${game}&game_player_id=${steam_id}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
    };
    const response = await fetch(webURL, { headers });
    if (!response.ok) {
      return undefined;
    }
    const data = await response.json();
    const elo = Number(data["games"][game]["faceit_elo"]);
    const rank = Number(data["games"][game]["skill_level"]);
    const player_id = data["player_id"];
    return {
      elo,
      rank,
      player_id
    };
  } catch (_err) {
    // NO-OP
    return null;
  }
};

const getMonthDifference = (timestamp1: number, timestamp2: number) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const yearsDiff = date2.getFullYear() - date1.getFullYear();
  const monthsDiff = date2.getMonth() - date1.getMonth();

  return yearsDiff * 12 + monthsDiff;
};

const applyDecay = (
  type: "elo" | "rank",
  last_value: number,
  min_value: number,
  last_match?: number
) => {
  const clamp = (num: number, min: number) => Math.max(num, min);
  if (!last_match) {
    return clamp(last_value, min_value);
  }
  const currentTime = new Date().getTime();
  const monthsDiff = getMonthDifference(last_match, currentTime);

  let decay = 0;

  if (type === "rank") {
    if (monthsDiff >= 3) decay = 1;
    if (monthsDiff >= 8) decay = 2;
    if (monthsDiff >= 12) decay = 3;
  } else if (type === "elo") {
    if (monthsDiff >= 3) decay = last_value * 0.05; // 5%
    if (monthsDiff >= 8) decay = last_value * 0.1; // 10%
    if (monthsDiff >= 12) decay = last_value * 0.15; // 15%
  } else {
    return clamp(last_value, min_value);
  }
  if (min_value > last_value) {
    min_value = last_value;
  }
  return clamp(last_value - decay, min_value);
};

const getFaceITCSGORank = async (steam_id: string) => {
  const data = await getFaceITGameRank(steam_id, "csgo");
  if (!data) {
    // Fallback to defaults
    return {
      faceit_level: -1,
      faceit_elo: -1,
      faceit_kd: -1,
      faceit_date: new Date().getTime(),
      metadata: {
        faceit_matches_played: undefined,
        faceit_last_match: undefined,
        faceit_decay: false
      }
    } satisfies FaceITCSRank;
  }
  const faceit_metadata = await getFaceITMetaData(data.player_id);
  const decayedRank = applyDecay(
    "rank",
    data.rank,
    5,
    faceit_metadata.faceit_last_match
  );
  const decayedElo = applyDecay(
    "elo",
    data.elo,
    1150,
    faceit_metadata.faceit_last_match
  );
  const returnData = {
    faceit_level: decayedRank,
    faceit_elo: decayedElo,
    faceit_kd: faceit_metadata.faceit_kdr,
    faceit_date: new Date().getTime(),
    metadata: {
      faceit_matches_played: faceit_metadata.faceit_matches_played,
      faceit_last_match: faceit_metadata.faceit_last_match,
      faceit_decay: decayedRank !== data.rank || decayedElo !== data.elo
    }
  } satisfies FaceITCSRank;
  return returnData;
};

const getFaceITCS2Rank = async (steam_id: string) => {
  const redisKey = `730-${steam_id}-faceit-cs2-rank`;
  const fromRedis = await redisClient.get(redisKey);
  if (fromRedis) {
    return JSON.parse(fromRedis) as FaceITCSRank;
  }
  const faceitRanks = await getFaceITGameRank(steam_id, "cs2");
  if (!faceitRanks) {
    // Fallback to CSGO rank
    const csgoFaceItRank = await getFaceITCSGORank(steam_id);
    await redisClient.set(
      redisKey,
      JSON.stringify(csgoFaceItRank),
      "EX",
      expireIn30Days
    );
    return csgoFaceItRank;
  }
  const faceit_metadata = await getFaceITMetaData(faceitRanks.player_id);
  const returnData = {
    faceit_level: faceitRanks.rank,
    faceit_elo: faceitRanks.elo,
    faceit_kd: faceit_metadata.faceit_kdr,
    faceit_date: new Date().getTime(),
    metadata: {
      faceit_matches_played: faceit_metadata.faceit_matches_played,
      faceit_last_match: faceit_metadata.faceit_last_match,
      faceit_decay: false
    }
  } satisfies FaceITCSRank;
  await redisClient.set(
    redisKey,
    JSON.stringify(returnData),
    "EX",
    expireIn30Days
  );
  return returnData;
};

interface IPlayerServiceResponse {
  response: {
    games: {
      appid: number;
      playtime_forever: number;
    }[];
  };
}

const expireIn30Days = 30 * 24 * 60 * 60;

const getPlayerHoursForCS = async (steam_id: string, season_id?: string) => {
  const redisKey = `730-${steam_id}-hours`;
  // Return rank for season_id from db, i.e. if admin has added manually
  if (season_id) {
    const hoursFromDb = await getPlayerHoursForSeason(steam_id, season_id);
    if (hoursFromDb) {
      await redisClient.set(redisKey, hoursFromDb.hours, "EX", expireIn30Days);
      return hoursFromDb;
    }
  }
  const webURL = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steam_id}&appids_filter=730`;
  const hoursInRedis = await redisClient.get(redisKey);
  if (hoursInRedis) {
    return { hours: Number(hoursInRedis) };
  }

  const fromSteam = await fetch(webURL);
  if (!fromSteam.ok) {
    return { hours: -1 };
  }
  const data: IPlayerServiceResponse = await fromSteam.json();
  const games = data.response.games;
  const requestedAppId = games.find((game) => String(game.appid) === "730");

  // Remove this if we wish to fallback to db latest season hours.
  if (!requestedAppId) {
    return { hours: -1 };
  }

  const hoursFromSteam = Math.round(requestedAppId.playtime_forever / 60);
  await redisClient.set(redisKey, hoursFromSteam, "EX", expireIn30Days);

  return { hours: hoursFromSteam };
};

export const getPlayerHoursForSteamAppId = async (
  steam_id: string,
  app_id: string,
  season_id?: string
) => {
  switch (app_id) {
    case "730": // CS
      return getCSRank(steam_id, season_id);
    default:
      throw new Error("Unknown app_id");
  }
};

export const getPlayerAppIdRank = async (
  steam_id: string,
  app_id: string,
  season_id?: string
) => {
  switch (app_id) {
    case "730": // CS
      return getPlayerHoursForCS(steam_id, season_id);
    default:
      throw new Error("Unknown app_id");
  }
};

export const getCSRank = async (steam_id: string, season_id?: string) => {
  const redisKey = `730-${steam_id}-rank`;
  if (season_id) {
    const rankFromDb = await getPlayerRankForSeason(steam_id, season_id);
    if (rankFromDb) {
      await redisClient.set(redisKey, rankFromDb.rank, "EX", expireIn30Days);
      return rankFromDb;
    }
  }
  const rankInRedis = await redisClient.get(redisKey);
  if (rankInRedis) {
    return { rank: Number(rankInRedis) };
  }
  const leetifyRank = await getCS2RankFromLeetify(steam_id);
  if (leetifyRank) {
    await redisClient.set(redisKey, leetifyRank.rank, "EX", expireIn30Days);
    return leetifyRank;
  }
  // Try to get latest cs2_rank from database
  const result = await runQuery<
    Array<{
      cs2_rank: SeasonPlayerRank["cs2_rank"];
      csgo_rank: SeasonPlayerRank["csgo_rank"];
    }>
  >(
    "SELECT cs2_rank, csgo_rank FROM SeasonPlayerRanks WHERE steam_id = ? ORDER BY season_id DESC",
    [steam_id]
  );
  if (!_.isEmpty(result)) {
    const firstCS2Rank = result.find((rank) => rank.cs2_rank);
    if (firstCS2Rank?.cs2_rank) {
      await redisClient.set(
        redisKey,
        firstCS2Rank.cs2_rank,
        "EX",
        expireIn30Days
      );
      return { rank: firstCS2Rank.cs2_rank };
    }
    const firstCSGORank = result.find((rank) => rank.csgo_rank);
    if (firstCSGORank?.csgo_rank) {
      const convertedToCS2 = convertCSGORankToCS2(firstCSGORank.csgo_rank);
      await redisClient.set(
        redisKey,
        convertedToCS2.rank,
        "EX",
        expireIn30Days
      );
      return { rank: convertedToCS2.rank };
    }
  }
  return { rank: -1 };
};

export const getPlayerRankForPlatform = async (
  steam_id: string,
  platform: SeasonPlatform
) => {
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return getFaceITCS2Rank(steam_id);
    default:
      throw new Error("Unknown platform");
  }
};
