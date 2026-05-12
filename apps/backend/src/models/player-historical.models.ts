import { runQuery } from "../db/mysqlRunQuery";
import {
  type PlayerHistoricalData,
  type PlayerHistoricalAverage,
  type HistoricalDataParams
} from "@eggosystem/types";

export const getPlayerHistoricalData = async (
  steam_id: string,
  params: HistoricalDataParams = {}
): Promise<PlayerHistoricalData[]> => {
  const { games, period } = params;

  let periodClause = "";
  let limitClause = "";

  if (period === "this_season") {
    periodClause = `AND m.season_id = (
      SELECT s.id
      FROM Seasons s
      JOIN Games g ON s.game_id = g.id
      WHERE g.app_id = 730
        AND s.start_date <= NOW() 
        AND (s.end_date IS NULL OR s.end_date >= NOW())
      ORDER BY s.id DESC
      LIMIT 1
    )`;
  } else if (period === "last_season") {
    periodClause = `AND m.season_id = (
      SELECT s.id
      FROM Seasons s
      JOIN Games g ON s.game_id = g.id
      WHERE g.app_id = 730
        AND s.end_date IS NOT NULL
        AND s.end_date < NOW()
      ORDER BY s.id DESC
      LIMIT 1
    )`;
  } else if (games) {
    // Default: limit by number of games
    limitClause = `LIMIT ${games}`;
  }

  const query = `
    SELECT 
      m.id as match_id,
      mg.id as match_game_id,
      DATE(m.start_timestamp) as match_date,
      ps.kana_rating,
      CASE 
        WHEN ps.deaths = 0 THEN ps.kills 
        ELSE ROUND(ps.kills / ps.deaths, 2)
      END as kd_ratio,
      ps.adr,
      ps.ttd,
      ps.crosshair_placement,
      CASE 
        WHEN ps.total_strafing_shots = 0 THEN NULL
        ELSE ROUND((ps.good_strafing_shots / ps.total_strafing_shots) * 100, 1)
      END as counter_strafing_percent,
      ps.hs_percent
    FROM PlayerStats ps
    INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    WHERE ps.steam_id = ?
      ${periodClause}
    ORDER BY m.start_timestamp DESC
    ${limitClause}
  `;

  return runQuery<PlayerHistoricalData[]>(query, [steam_id]);
};

export const getPlayerHistoricalAverageByRank = async (
  rank: number,
  _params: HistoricalDataParams = {}
): Promise<PlayerHistoricalAverage> => {
  // Calculate rank range: ±500, with special handling for low ranks
  let minRank: number;
  let maxRank: number;

  if (rank <= 500) {
    // For ranks 0-500, use range 0-1000
    minRank = 0;
    maxRank = 1000;
  } else {
    // For ranks above 500, use ±500 range
    minRank = Math.max(0, rank - 500);
    maxRank = Math.min(30000, rank + 500); // Cap at max possible CS2 rank
  }

  // Use the simple query approach without season-matching requirement
  const query = `
    SELECT 
      ROUND(AVG(ps.kana_rating), 1) as avg_kana_rating,
      ROUND(AVG(CASE 
        WHEN ps.deaths = 0 THEN ps.kills 
        ELSE ps.kills / ps.deaths 
      END), 2) as avg_kd_ratio,
      ROUND(AVG(ps.adr), 1) as avg_adr,
      ROUND(AVG(ps.ttd), 1) as avg_ttd,
      ROUND(AVG(ps.crosshair_placement), 1) as avg_crosshair_placement,
      ROUND(AVG(CASE 
        WHEN ps.total_strafing_shots = 0 THEN NULL
        ELSE (ps.good_strafing_shots / ps.total_strafing_shots) * 100
      END), 1) as avg_counter_strafing_percent,
      ROUND(AVG(ps.hs_percent), 1) as avg_hs_percent
    FROM PlayerStats ps
    JOIN SteamPlayers sp ON ps.steam_id = sp.steam_id
    JOIN SeasonPlayerRanks spr ON sp.steam_id = spr.steam_id
    WHERE ps.kana_rating IS NOT NULL 
      AND ps.adr IS NOT NULL 
      AND ps.hs_percent IS NOT NULL
      AND spr.cs2_rank >= ? 
      AND spr.cs2_rank <= ?
  `;

  const result = await runQuery<PlayerHistoricalAverage[]>(query, [
    minRank,
    maxRank
  ]);
  return (
    result[0] || {
      avg_kana_rating: 0,
      avg_kd_ratio: 0,
      avg_adr: 0,
      avg_ttd: null,
      avg_crosshair_placement: null,
      avg_counter_strafing_percent: null,
      avg_hs_percent: 0
    }
  );
};

export const getPlayerHistoricalAverageByLevel = async (
  level: number,
  _params: HistoricalDataParams = {}
): Promise<PlayerHistoricalAverage> => {
  // Use simple query approach for consistent results with proper skill progression
  const query = `
    SELECT 
      ROUND(AVG(ps.kana_rating), 1) as avg_kana_rating,
      ROUND(AVG(CASE 
        WHEN ps.deaths = 0 THEN ps.kills 
        ELSE ps.kills / ps.deaths 
      END), 2) as avg_kd_ratio,
      ROUND(AVG(ps.adr), 1) as avg_adr,
      ROUND(AVG(ps.ttd), 1) as avg_ttd,
      ROUND(AVG(ps.crosshair_placement), 1) as avg_crosshair_placement,
      ROUND(AVG(CASE 
        WHEN ps.total_strafing_shots = 0 THEN NULL
        ELSE (ps.good_strafing_shots / ps.total_strafing_shots) * 100
      END), 1) as avg_counter_strafing_percent,
      ROUND(AVG(ps.hs_percent), 1) as avg_hs_percent
    FROM PlayerStats ps
    JOIN SteamPlayers sp ON ps.steam_id = sp.steam_id
    JOIN SeasonPlayerRanks spr ON sp.steam_id = spr.steam_id
    WHERE ps.kana_rating IS NOT NULL 
      AND ps.adr IS NOT NULL 
      AND ps.hs_percent IS NOT NULL
      AND spr.faceit_level = ?
  `;

  const result = await runQuery<PlayerHistoricalAverage[]>(query, [level]);
  return (
    result[0] || {
      avg_kana_rating: 0,
      avg_kd_ratio: 0,
      avg_adr: 0,
      avg_ttd: null,
      avg_crosshair_placement: null,
      avg_counter_strafing_percent: null,
      avg_hs_percent: 0
    }
  );
};

export const getPlayerHistoricalAverage = async (
  _params: HistoricalDataParams = {}
): Promise<PlayerHistoricalAverage> => {
  // Always use the simple baseline query - no filters, all time, all players
  const query = `
    SELECT 
      ROUND(AVG(ps.kana_rating), 1) as avg_kana_rating,
      ROUND(AVG(CASE 
        WHEN ps.deaths = 0 THEN ps.kills 
        ELSE ps.kills / ps.deaths 
      END), 2) as avg_kd_ratio,
      ROUND(AVG(ps.adr), 1) as avg_adr,
      ROUND(AVG(ps.ttd), 1) as avg_ttd,
      ROUND(AVG(ps.crosshair_placement), 1) as avg_crosshair_placement,
      ROUND(AVG(CASE 
        WHEN ps.total_strafing_shots = 0 THEN NULL
        ELSE (ps.good_strafing_shots / ps.total_strafing_shots) * 100
      END), 1) as avg_counter_strafing_percent,
      ROUND(AVG(ps.hs_percent), 1) as avg_hs_percent
    FROM PlayerStats ps
    WHERE ps.kana_rating IS NOT NULL 
      AND ps.adr IS NOT NULL 
      AND ps.hs_percent IS NOT NULL
  `;

  const result = await runQuery<PlayerHistoricalAverage[]>(query);
  return (
    result[0] || {
      avg_kana_rating: 0,
      avg_kd_ratio: 0,
      avg_adr: 0,
      avg_ttd: null,
      avg_crosshair_placement: null,
      avg_counter_strafing_percent: null,
      avg_hs_percent: 0
    }
  );
};
