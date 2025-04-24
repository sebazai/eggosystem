import { type FaceITCSRank } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getPlayerHoursForSeason = async (
  steam_id: string,
  season_id: number
) => {
  const [hours] = await runQuery<Array<{ hours: number } | undefined>>(
    "SELECT cs_hours as hours FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return hours;
};

export const getPlayerRankForSeason = async (
  steam_id: string,
  season_id: number
) => {
  const [rank] = await runQuery<Array<{ rank: number } | undefined>>(
    "SELECT cs2_rank as rank FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return rank;
};

export const insertFaceITPlayerRankForSeason = async (
  steamId: string,
  seasonId: number,
  CS2Rank: number,
  CS2Hours: number,
  FaceITRank: FaceITCSRank,
  connection?: PoolConnection
) => {
  const faceitLevel = FaceITRank.faceit_level;
  const faceitDate = new Date(FaceITRank.faceit_date);
  const faceitElo = FaceITRank.faceit_elo;
  const faceitKD = FaceITRank.faceit_kd;

  const now = new Date();

  const query = `
      INSERT INTO SeasonPlayerRanks (
        steam_id,
        season_id,
        rank_updated_at,
        cs2_rank,
        cs_hours,
        faceit_level,
        faceit_elo,
        faceit_kd,
        faceit_date,
        hours_updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rank_updated_at = IF(VALUES(cs2_rank) != -1, VALUES(rank_updated_at), rank_updated_at),
        cs2_rank = IF(VALUES(cs2_rank) != -1, VALUES(cs2_rank), cs2_rank),
        cs_hours = IF(VALUES(cs_hours) != -1, VALUES(cs_hours), cs_hours),
        faceit_level = IF(VALUES(faceit_level) != -1, VALUES(faceit_level), faceit_level),
        faceit_elo = IF(VALUES(faceit_elo) != -1, VALUES(faceit_elo), faceit_elo),
        faceit_kd = IF(VALUES(faceit_kd) != -1, VALUES(faceit_kd), faceit_kd),
        faceit_date = IF(VALUES(faceit_elo) != -1, VALUES(faceit_date), faceit_date),
        hours_updated_at = IF(VALUES(cs_hours) != -1, VALUES(hours_updated_at), hours_updated_at)
    `;
  return runQuery(
    query,
    [
      steamId,
      seasonId,
      now,
      CS2Rank,
      CS2Hours,
      faceitLevel,
      faceitElo,
      faceitKD,
      faceitDate,
      now
    ],
    connection
  );
};
