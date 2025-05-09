import {
  type SeasonPlayerRank,
  type CS2LeetifyAvgRank,
  SeasonPlatform
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import _ from "lodash";
import { expireIn30Days, redisClient } from "../utils/redisClient";
import {
  getPlayerHoursForSeason,
  getPlayerRankForSeason
} from "../models/season-player-ranks.models";
import { getCS2RankFromLeetify } from "./leetify.services";
import { getFaceITCS2Rank } from "./faceit.services";
import { getSteamHoursForAppId } from "./steam.services";
import { BadRequestError } from "../utils/errors";

const getPlayerHoursForCS = async (steam_id: string, season_id?: number) => {
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

  const steamHours = await getSteamHoursForAppId(steam_id, 730);
  if (!steamHours) {
    return { hours: -1 };
  }

  const hoursFromSteam = Math.round(steamHours.playtime_forever / 60);
  await redisClient.set(redisKey, hoursFromSteam, "EX", expireIn30Days);

  return { hours: hoursFromSteam };
};

export const getPlayerHoursForSteamAppId = async (
  steam_id: string,
  app_id: number,
  season_id?: number
) => {
  switch (app_id) {
    case 730: // CS
      return getPlayerHoursForCS(steam_id, season_id);
    default:
      throw new BadRequestError("Unknown app_id");
  }
};

export const getPlayerAppIdRank = async (
  steam_id: string,
  app_id: number,
  season_id?: number
) => {
  switch (app_id) {
    case 730: // CS
      return getCSRank(steam_id, season_id);
    default:
      throw new BadRequestError("Unknown app_id");
  }
};

export const getCSRank = async (steam_id: string, season_id?: number) => {
  // If someone added the rank to database for season, we use that one
  if (season_id) {
    const rankFromDb = await getPlayerRankForSeason(steam_id, season_id);
    if (rankFromDb) {
      return rankFromDb;
    }
  }

  const redisKey = `730-${steam_id}-rank`;
  const rankInRedis = await redisClient.get(redisKey);
  if (rankInRedis) {
    return JSON.parse(rankInRedis) as CS2LeetifyAvgRank;
  }

  const leetifyRank = await getCS2RankFromLeetify(steam_id);
  if (leetifyRank) {
    await redisClient.set(
      redisKey,
      JSON.stringify(leetifyRank),
      "EX",
      expireIn30Days
    );
    return leetifyRank;
  }

  // FALLBACK: Try to get latest known cs2_rank for the latest season from database
  const result = await runQuery<
    Array<{
      cs2_rank: SeasonPlayerRank["cs2_rank"];
      rank_updated_at: SeasonPlayerRank["rank_updated_at"];
    }>
  >(
    "SELECT cs2_rank, rank_updated_at FROM SeasonPlayerRanks WHERE steam_id = ? ORDER BY season_id DESC",
    [steam_id]
  );
  if (!_.isEmpty(result)) {
    const cs2RanksInKanaliiga = result
      .filter(
        (
          rank
        ): rank is {
          cs2_rank: number;
          rank_updated_at: SeasonPlayerRank["rank_updated_at"];
        } => rank.cs2_rank !== null && rank.cs2_rank > 0
      )
      .sort((a, b) => {
        if (a.rank_updated_at === null) return 1;
        if (b.rank_updated_at === null) return -1;

        return (
          new Date(b.rank_updated_at).getTime() -
          new Date(a.rank_updated_at).getTime()
        );
      });

    if (cs2RanksInKanaliiga.length > 0) {
      const totalSkillLevel = cs2RanksInKanaliiga.reduce(
        (sum, g) => sum + g.cs2_rank,
        0
      );

      const averageSkillLevel = totalSkillLevel / cs2RanksInKanaliiga.length;
      const data = {
        average_rank: Math.round(averageSkillLevel),
        rank_updated_at: cs2RanksInKanaliiga[0].rank_updated_at
      } satisfies CS2LeetifyAvgRank;
      await redisClient.set(
        redisKey,
        JSON.stringify(data),
        "EX",
        expireIn30Days
      );
      return data;
    }
  }
  return {
    average_rank: -1,
    rank_updated_at: null
  } satisfies CS2LeetifyAvgRank;
};

export const getPlayerRankForPlatform = async (
  steam_id: string,
  platform: SeasonPlatform
) => {
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return getFaceITCS2Rank(steam_id);
    case SeasonPlatform.Kanaliiga:
      return null;
    default:
      throw new BadRequestError("Unknown platform");
  }
};
