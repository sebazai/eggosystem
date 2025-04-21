import { type SeasonPlayerRank, SeasonPlatform } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import _ from "lodash";
import { expireIn30Days, redisClient } from "../utils/redisClient";
import {
  getPlayerHoursForSeason,
  getPlayerRankForSeason
} from "../models/seasonplayerranks.models";
import { convertCSGORankToCS2 } from "../utils/ranks";
import { getCS2RankFromLeetify } from "./leetify.services";
import { getFaceITCS2Rank } from "./faceit.services";
import { getSteamHoursForAppId } from "./steam.services";

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

  const hoursInRedis = await redisClient.get(redisKey);
  if (hoursInRedis) {
    return { hours: Number(hoursInRedis) };
  }

  const steamHours = await getSteamHoursForAppId(steam_id, "730");
  if (!steamHours) {
    return { hours: -1 };
  }

  const hoursFromSteam = Math.round(steamHours.playtime_forever / 60);
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
      return getPlayerHoursForCS(steam_id, season_id);
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
      return getCSRank(steam_id, season_id);
    default:
      throw new Error("Unknown app_id");
  }
};

export const getCSRank = async (steam_id: string, season_id?: string) => {
  const redisKey = `730-${steam_id}-rank`;

  // If someone added the rank to database, we use that one
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

  // FALLBACK: Try to get latest known cs2_rank for the latest season from database
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
