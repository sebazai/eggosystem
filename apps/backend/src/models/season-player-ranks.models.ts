import {
  type SeasonPlayerRank,
  type FaceITCSRank,
  type SeasonPlatform,
  type SteamPlayer
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { getOrganizerActiveOrLatestSeasonForAppId } from "./season.models";

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

export const insertPlayerRankForSeason = async (
  steamId: string,
  seasonId: number,
  CS2Rank: SeasonPlayerRank["cs2_rank"],
  CS2Hours: SeasonPlayerRank["cs_hours"],
  FaceITRank: Omit<Partial<FaceITCSRank>, "metadata">,
  options?: {
    connection?: PoolConnection;
    isManuallyAddedExternalRank?: boolean;
    isManuallyAddedRank?: boolean;
    ticket_id?: string;
  }
) => {
  const faceitLevel = FaceITRank?.faceit_level;

  const faceitElo = FaceITRank?.faceit_elo;
  const faceitKD = FaceITRank?.faceit_kd;

  const now = new Date();
  const faceitDate = FaceITRank?.faceit_date
    ? new Date(FaceITRank?.faceit_date)
    : now;
  const manuallyAddedExternalRank = !!options?.isManuallyAddedExternalRank;
  const manuallyAddedRank = !!options?.isManuallyAddedRank;

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
        manual_external_rank,
        manual_steam_rank,
        ticket_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rank_updated_at = IF(VALUES(cs2_rank) IS NOT NULL, VALUES(rank_updated_at), rank_updated_at),
        cs2_rank = IF(VALUES(cs2_rank) IS NOT NULL, VALUES(cs2_rank), cs2_rank),
        cs_hours = IF(VALUES(cs_hours) IS NOT NULL, VALUES(cs_hours), cs_hours),
        faceit_level = IF(VALUES(faceit_level) IS NOT NULL, VALUES(faceit_level), faceit_level),
        faceit_elo = IF(VALUES(faceit_elo) IS NOT NULL, VALUES(faceit_elo), faceit_elo),
        faceit_kd = IF(VALUES(faceit_kd) IS NOT NULL, VALUES(faceit_kd), faceit_kd),
        faceit_date = IF(VALUES(faceit_elo) IS NOT NULL, VALUES(faceit_date), faceit_date),
        hours_updated_at = IF(VALUES(cs_hours) IS NOT NULL, VALUES(hours_updated_at), hours_updated_at),
        manual_external_rank = VALUES(manual_external_rank),
        manual_steam_rank = VALUES(manual_steam_rank),
        ticket_id = VALUES(ticket_id)
    `;

  return runQuery(
    query,
    [
      steamId,
      seasonId,
      CS2Rank ? now : null,
      CS2Rank,
      CS2Hours,
      faceitLevel ?? null,
      faceitElo ?? null,
      faceitKD ?? null,
      faceitElo ? faceitDate : null,
      CS2Hours ? now : null,
      manuallyAddedExternalRank,
      manuallyAddedRank,
      options?.ticket_id ?? null
    ],
    options?.connection
  );
};

export const updateSeasonPlayerRankKanaElo = async (
  steam_id: string,
  season_id: number,
  kana_elo: number,
  connection?: PoolConnection
) => {
  await runQuery(
    `UPDATE SeasonPlayerRanks SET kana_elo = ? WHERE steam_id = ? AND season_id = ?`,
    [kana_elo, steam_id, season_id],
    connection
  );
};

export const getPlayerKanaElo = async (steam_id: string) => {
  const result = await runQuery<Array<{ kana_elo: number }>>(
    `SELECT kana_elo
      FROM SeasonPlayerRanks
      WHERE steam_id = ? AND kana_elo IS NOT NULL
      ORDER BY season_id DESC
      LIMIT 1`,
    [steam_id]
  );

  return result.length > 0 ? result[0] : null;
};

export const getTopXPlayersKanaElo = async (x: number) => {
  // TODO(#220): accept organizer_id and app_id as params for multi-org support
  const activeSeason = await getOrganizerActiveOrLatestSeasonForAppId(1, 730);

  if (!activeSeason) {
    return [];
  }

  return runQuery<
    Array<{
      steam_id: SteamPlayer["steam_id"];
      kana_elo: SeasonPlayerRank["kana_elo"];
    }>
  >(
    `SELECT steam_id, kana_elo 
     FROM SeasonPlayerRanks 
     WHERE kana_elo IS NOT NULL
     AND season_id = ?
     GROUP BY steam_id
     ORDER BY kana_elo DESC
     LIMIT ?`,
    [activeSeason.season_id, x]
  );
};

/**
 * Get the latest season_id for a player from SeasonPlayerRanks
 * @param steam_id The steam ID of the player
 * @returns The latest season_id or null if not found
 */
export const getLatestSeasonForPlayer = async (
  steam_id: string
): Promise<number | null> => {
  const [result] = await runQuery<
    Array<{ latest_season_id: number | null } | undefined>
  >(
    `SELECT MAX(season_id) as latest_season_id 
     FROM SeasonPlayerRanks 
     WHERE steam_id = ?`,
    [steam_id]
  );

  return result?.latest_season_id ?? null;
};
