import { runQuery } from "../db/mysqlRunQuery";
import {
  type PlayerHistoricalData,
  type PlayerHistoricalAverage,
  type PlayerActiveSeasons,
  type PlayerActiveSeason,
  type HistoricalDataParams
} from "@eggosystem/types";

export const getPlayerActiveSeasons = async (
  steam_id: string,
  app_id: number = 730
): Promise<PlayerActiveSeasons> => {
  const baseJoins = `
    FROM Seasons s
    JOIN Games g ON s.game_id = g.id
    JOIN Matches m ON m.season_id = s.id
    JOIN MatchGames mg ON mg.match_id = m.id
    JOIN PlayerStats ps ON ps.match_game_id = mg.id
    WHERE ps.steam_id = ?
      AND g.app_id = ?
  `;

  const [currentRow] = await runQuery<Array<PlayerActiveSeason | undefined>>(
    `SELECT s.id AS season_id, s.full_name, s.start_date, s.end_date
     ${baseJoins}
       AND s.start_date <= NOW()
       AND (s.end_date IS NULL OR s.end_date >= NOW())
     ORDER BY s.id DESC
     LIMIT 1`,
    [steam_id, app_id]
  );

  const [lastRow] = await runQuery<Array<PlayerActiveSeason | undefined>>(
    `SELECT s.id AS season_id, s.full_name, s.start_date, s.end_date
     ${baseJoins}
       AND s.end_date IS NOT NULL
       AND s.end_date < NOW()
     ORDER BY s.id DESC
     LIMIT 1`,
    [steam_id, app_id]
  );

  return {
    current_season: currentRow ?? null,
    last_season: lastRow ?? null
  };
};

export const getPlayerHistoricalData = async (
  steam_id: string,
  params: HistoricalDataParams = {}
): Promise<PlayerHistoricalData[]> => {
  const { games, season_id } = params;

  const seasonClause = season_id ? `AND m.season_id = ?` : "";
  const limitClause =
    !season_id && games !== undefined && Number.isInteger(games) && games > 0
      ? `LIMIT ${games}`
      : "";
  const binds: (string | number)[] = [steam_id];
  if (season_id) binds.push(season_id);

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
      ${seasonClause}
    ORDER BY m.start_timestamp DESC
    ${limitClause}
  `;

  return runQuery<PlayerHistoricalData[]>(query, binds);
};

export const getPlayerHistoricalAverageByRank = async (
  rank: number,
  _params: HistoricalDataParams = {}
): Promise<PlayerHistoricalAverage> => {
  let minRank: number;
  let maxRank: number;

  if (rank <= 500) {
    minRank = 0;
    maxRank = 1000;
  } else {
    minRank = Math.max(0, rank - 500);
    maxRank = Math.min(30000, rank + 500);
  }

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
