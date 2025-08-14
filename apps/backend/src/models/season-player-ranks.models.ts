import {
  type SeasonPlayerRank,
  type FaceITCSRank,
  type SeasonPlatform,
  type SteamPlayer,
  type SteamPlayerKanaElo
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getPlayerHoursForSeason = async (
  steam_id: string,
  season_id: number
) => {
  const [hours] = await runQuery<
    Array<{ hours: SeasonPlayerRank["cs_hours"] } | undefined>
  >(
    "SELECT cs_hours as hours FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return hours;
};

/**
 * If admin added rank, we can get the rank for season in signup, though not average.
 * @param steam_id
 * @param season_id
 * @returns
 */
export const getPlayerRankForSeason = async (
  steam_id: string,
  season_id: number
) => {
  const [rank] = await runQuery<
    Array<
      | {
          average_rank: number;
          rank_updated_at: SeasonPlayerRank["rank_updated_at"];
        }
      | undefined
    >
  >(
    "SELECT cs2_rank AS average_rank, rank_updated_at FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return rank;
};

export const getPlayerExternalRankForSeason = async (
  steam_id: string,
  season_id: number,
  platform: SeasonPlatform
) => {
  const [externalRank] = await runQuery<
    Array<Omit<Partial<FaceITCSRank>, "metadata"> | undefined>
  >(
    `SELECT spr.faceit_elo, spr.faceit_level, spr.faceit_kd, spr.faceit_date FROM SeasonPlayerRanks spr 
      JOIN Seasons s ON s.id = spr.season_id
    WHERE spr.steam_id = ? AND spr.season_id = ? AND s.platform = ? LIMIT 1`,
    [steam_id, season_id, platform]
  );

  return externalRank;
};

export const insertCSPlayerRankForSeason = async (
  steamId: string,
  seasonId: number,
  CS2Rank: SeasonPlayerRank["cs2_rank"],
  CS2Hours: SeasonPlayerRank["cs_hours"],
  options?: { connection?: PoolConnection; isManuallyAdded?: boolean }
) => {
  const now = new Date();
  const manuallyAddedRank = !!options?.isManuallyAdded;

  const query = `
      INSERT INTO SeasonPlayerRanks (
        steam_id,
        season_id,
        rank_updated_at,
        cs2_rank,
        cs_hours,
        hours_updated_at,
        manual_steam_rank
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rank_updated_at = IF(VALUES(cs2_rank) IS NOT NULL, VALUES(rank_updated_at), rank_updated_at),
        cs2_rank = IF(VALUES(cs2_rank) IS NOT NULL, VALUES(cs2_rank), cs2_rank),
        cs_hours = IF(VALUES(cs_hours) IS NOT NULL, VALUES(cs_hours), cs_hours),
        hours_updated_at = IF(VALUES(cs_hours) IS NOT NULL, VALUES(hours_updated_at), hours_updated_at),
        manual_steam_rank = VALUES(manual_steam_rank)
    `;

  return runQuery(
    query,
    [steamId, seasonId, now, CS2Rank, CS2Hours, now, manuallyAddedRank],
    options?.connection
  );
};

export const insertFaceITPlayerRankForSeason = async (
  steamId: string,
  seasonId: number,
  CS2Rank: SeasonPlayerRank["cs2_rank"],
  CS2Hours: SeasonPlayerRank["cs_hours"],
  FaceITRank: Omit<FaceITCSRank, "metadata">,
  options?: { connection?: PoolConnection; isManuallyAdded?: boolean }
) => {
  const faceitLevel = FaceITRank.faceit_level;
  const faceitDate = new Date(FaceITRank.faceit_date);
  const faceitElo = FaceITRank.faceit_elo;
  const faceitKD = FaceITRank.faceit_kd;

  const now = new Date();
  const manuallyAddedRank = !!options?.isManuallyAdded;

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
        hours_updated_at, 
        manual_external_rank
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rank_updated_at = IF(VALUES(cs2_rank) IS NOT NULL, VALUES(rank_updated_at), rank_updated_at),
        cs2_rank = IF(VALUES(cs2_rank) IS NOT NULL, VALUES(cs2_rank), cs2_rank),
        cs_hours = IF(VALUES(cs_hours) IS NOT NULL, VALUES(cs_hours), cs_hours),
        faceit_level = IF(VALUES(faceit_level) IS NOT NULL, VALUES(faceit_level), faceit_level),
        faceit_elo = IF(VALUES(faceit_elo) IS NOT NULL, VALUES(faceit_elo), faceit_elo),
        faceit_kd = IF(VALUES(faceit_kd) IS NOT NULL, VALUES(faceit_kd), faceit_kd),
        faceit_date = IF(VALUES(faceit_elo) IS NOT NULL, VALUES(faceit_date), faceit_date),
        hours_updated_at = IF(VALUES(cs_hours) IS NOT NULL, VALUES(hours_updated_at), hours_updated_at),
        manual_external_rank = VALUES(manual_external_rank)
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
      now,
      manuallyAddedRank
    ],
    options?.connection
  );
};

export const getPlayerKanaElo = async (steam_id: string) => {
  const [result] = await runQuery<
    Array<{ kana_elo: SteamPlayerKanaElo["kana_elo"] } | undefined>
  >(
    `SELECT kana_elo 
      FROM SteamPlayerKanaElo 
      WHERE steam_id = ?`,
    [steam_id]
  );

  return result;
};

export const getTopXPlayersKanaElo = async (x: number) => {
  return runQuery<
    Array<{
      steam_id: SteamPlayer["steam_id"];
      kana_elo: SteamPlayerKanaElo["kana_elo"];
    }>
  >(
    `SELECT steam_id, kana_elo 
     FROM SteamPlayerKanaElo 
     ORDER BY kana_elo DESC
     LIMIT ?`,
    [x]
  );
};
