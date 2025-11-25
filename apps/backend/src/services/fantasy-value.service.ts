import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";
import {
  type PlayerTier,
  calculatePlayerTier,
  calculateInitialPlayerValue
} from "@eggosystem/types";

// Re-export for backward compatibility
export {
  type PlayerTier,
  calculatePlayerTier,
  calculateInitialPlayerValue as calculatePlayerValue
};

export interface PlayerValueData {
  value: number;
  tier: PlayerTier;
}

export interface WeeklyPerformanceStats {
  kana_rating: number;
  kd: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  headshot_percentage: number;
  kast: number;
  maps_played: number;
}

/**
 * Calculate player value and tier together
 * Tier is determined by value, not rating
 */
export const calculatePlayerValueData = (
  rating: number,
  kd: number,
  kills: number
): PlayerValueData => {
  const value = calculateInitialPlayerValue(rating, kd, kills);
  const tier = calculatePlayerTier(value); // Tier based on value
  return {
    value,
    tier
  };
};

/**
 * Get weekly performance stats for a player
 * @param steamId - Player's Steam ID
 * @param seasonId - Season ID
 * @param leagueId - League ID
 * @param weekNumber - Week number (1-indexed)
 * @param connection - Optional database connection
 */
export const getWeeklyPerformanceStats = async (
  steamId: string,
  seasonId: number,
  leagueId: number,
  weekNumber: number,
  connection?: PoolConnection
): Promise<WeeklyPerformanceStats | null> => {
  // Query player stats for the specific week
  // This assumes we have a way to determine which matches belong to which week
  // For now, we'll calculate based on match dates and season start date

  const query = `
    WITH season_info AS (
      SELECT start_date 
      FROM Seasons 
      WHERE id = ?
    ),
    week_matches AS (
      SELECT mg.id as match_game_id
      FROM MatchGames mg
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonLeagues sl ON m.season_id = sl.season_id AND m.league_id = sl.league_id
      CROSS JOIN season_info si
      WHERE m.season_id = ?
        AND m.league_id = ?
        AND m.status = 'finished'
        AND DATEDIFF(m.match_date, si.start_date) >= (? - 1) * 7
        AND DATEDIFF(m.match_date, si.start_date) < ? * 7
    )
    SELECT 
      COUNT(DISTINCT ps.match_game_id) as maps_played,
      COALESCE(ROUND(AVG(ps.kana_rating), 2), 0) as kana_rating,
      COALESCE(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 0) as kd,
      COALESCE(SUM(ps.kills), 0) as kills,
      COALESCE(SUM(ps.deaths), 0) as deaths,
      COALESCE(SUM(ps.assists), 0) as assists,
      COALESCE(AVG(ps.adr), 0) as adr,
      COALESCE(AVG(ps.hs_percent), 0) as headshot_percentage,
      COALESCE(AVG(ps.kast), 0) as kast
    FROM PlayerStats ps
    INNER JOIN week_matches wm ON wm.match_game_id = ps.match_game_id
    WHERE ps.steam_id = ?
  `;

  const [result] = await runQuery<
    Array<WeeklyPerformanceStats & { maps_played: number }>
  >(
    query,
    [seasonId, seasonId, leagueId, weekNumber, weekNumber, steamId],
    connection
  );

  if (!result || result.maps_played === 0) {
    return null;
  }

  return result;
};

/**
 * Calculate weekly price update for a player based on last week's performance
 * @param steamId - Player's Steam ID
 * @param seasonId - Season ID
 * @param leagueId - League ID
 * @param weekNumber - Week number to calculate for
 * @param connection - Optional database connection
 */
export const calculateWeeklyPriceUpdate = async (
  steamId: string,
  seasonId: number,
  leagueId: number,
  weekNumber: number,
  connection?: PoolConnection
): Promise<PlayerValueData | null> => {
  const stats = await getWeeklyPerformanceStats(
    steamId,
    seasonId,
    leagueId,
    weekNumber,
    connection
  );

  if (!stats) {
    return null;
  }

  return calculatePlayerValueData(stats.kana_rating, stats.kd, stats.kills);
};

/**
 * Get all players in a league and calculate their initial values
 * This is used for the initial fantasy player values when a season starts
 */
export const calculateInitialPlayerValues = async (
  seasonId: number,
  leagueId: number,
  connection?: PoolConnection
): Promise<
  Array<{
    steam_id: string;
    value: number;
    tier: PlayerTier;
    stats: WeeklyPerformanceStats;
  }>
> => {
  // Get all players who played in the previous season's league
  // Or use their current season stats if available
  const query = `
    SELECT 
      ps.steam_id,
      COUNT(DISTINCT ps.match_game_id) as maps_played,
      COALESCE(ROUND(AVG(ps.kana_rating), 2), 0.70) as kana_rating,
      COALESCE(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 1.0) as kd,
      COALESCE(SUM(ps.kills), 0) as kills,
      COALESCE(SUM(ps.deaths), 0) as deaths,
      COALESCE(SUM(ps.assists), 0) as assists,
      COALESCE(AVG(ps.adr), 0) as adr,
      COALESCE(AVG(ps.hs_percent), 0) as headshot_percentage,
      COALESCE(AVG(ps.kast), 0) as kast
    FROM PlayerStats ps
    INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    WHERE m.season_id = ?
      AND m.league_id = ?
      AND m.status = 'finished'
    GROUP BY ps.steam_id
    HAVING maps_played > 0
  `;

  const players = await runQuery<
    Array<WeeklyPerformanceStats & { steam_id: string }>
  >(query, [seasonId, leagueId], connection);

  return players.map(
    (player: WeeklyPerformanceStats & { steam_id: string }) => {
      const valueData = calculatePlayerValueData(
        player.kana_rating,
        player.kd,
        player.kills
      );
      return {
        steam_id: player.steam_id,
        value: valueData.value,
        tier: valueData.tier,
        stats: {
          kana_rating: player.kana_rating,
          kd: player.kd,
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
          adr: player.adr,
          headshot_percentage: player.headshot_percentage,
          kast: player.kast,
          maps_played: player.maps_played
        }
      };
    }
  );
};
