import { type FaceITCSRank } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getPlayerHoursForSeason = async (
  steam_id: string,
  season_id: string
) => {
  const [hours] = await runQuery<Array<{ hours: number } | undefined>>(
    "SELECT cs_hours as hours FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return hours;
};

export const getPlayerRankForSeason = async (
  steam_id: string,
  season_id: string
) => {
  const [rank] = await runQuery<Array<{ rank: number } | undefined>>(
    "SELECT cs2_rank as rank FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return rank;
};

export const insertFaceITPlayerRankForSeason = async (
  steamId: string,
  seasonId: string,
  CS2Rank: number,
  CS2Hours: number,
  FaceITRank: FaceITCSRank,
  connection: PoolConnection
) => {
  const faceitLevel = FaceITRank.faceit_level;
  const faceitDate = FaceITRank.faceit_date;
  const faceitElo = FaceITRank.faceit_elo;
  const faceitKD = FaceITRank.faceit_kd;

  const now = new Date();

  const query = `INSERT INTO SeasonPlayerRanks (steam_id, season_id, rank_updated_at, cs2_rank, cs_hours, faceit_level, faceit_elo, faceit_kd, faceit_date, hours_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  await runQuery(
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
