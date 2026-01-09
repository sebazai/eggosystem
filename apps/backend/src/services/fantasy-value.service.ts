import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";
import {
  type PlayerTier,
  calculatePlayerTier,
  calculateInitialPlayerValue
} from "@eggosystem/types";

interface PlayerValueData {
  value: number;
  tier: PlayerTier;
}

interface WeeklyPerformanceStats {
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
  kills: number,
  kanaElo?: number | null
): PlayerValueData => {
  const value = calculateInitialPlayerValue(rating, kd, kills, kanaElo);
  const tier = calculatePlayerTier(value); // Tier based on value
  return {
    value,
    tier
  };
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
    stats: WeeklyPerformanceStats & { kana_elo?: number };
  }>
> => {
  // Get all players who played in the previous season's league
  // Also fetch kana_elo from SeasonPlayerRanks for the same season
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
      COALESCE(AVG(ps.kast), 0) as kast,
      spr.kana_elo
    FROM PlayerStats ps
    INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    LEFT JOIN SeasonPlayerRanks spr ON spr.steam_id = ps.steam_id AND spr.season_id = ?
    WHERE m.season_id = ?
      AND m.league_id = ?
      AND m.status = 'finished'
    GROUP BY ps.steam_id
    HAVING maps_played > 0
  `;

  const players = await runQuery<
    Array<WeeklyPerformanceStats & { steam_id: string; kana_elo?: number }>
  >(query, [seasonId, seasonId, leagueId], connection);

  return players.map(
    (
      player: WeeklyPerformanceStats & { steam_id: string; kana_elo?: number }
    ) => {
      // Calculate value using kana_elo for better distribution
      const value = calculateInitialPlayerValue(
        player.kana_rating,
        player.kd,
        player.kills,
        player.kana_elo
      );
      const tier = calculatePlayerTier(value);
      return {
        steam_id: player.steam_id,
        value,
        tier,
        stats: {
          kana_rating: player.kana_rating,
          kd: player.kd,
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
          adr: player.adr,
          headshot_percentage: player.headshot_percentage,
          kast: player.kast,
          maps_played: player.maps_played,
          kana_elo: player.kana_elo
        }
      };
    }
  );
};
