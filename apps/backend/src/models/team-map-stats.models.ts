import { type TeamMapStats, type ParsedParams } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { generateQueryWithFilters } from "../utils/queryFilter";

/**
 * Get enhanced map statistics for a team including CT and T side performance
 * @param teamId The ID of the team to get stats for
 * @param filters Filters to apply to the query (season, league, map, stage)
 * @returns Promise resolving to an array of TeamMapStats objects
 */
export const getTeamEnhancedMapStats = async (
  teamId: number,
  filters: ParsedParams
): Promise<TeamMapStats[]> => {
  const { season_ids, league_ids, map_ids, stages } = filters;

  // Generate the filter query parts
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_ids },
    { column: "m.league_id", value: league_ids },
    { column: "mg.map_id", value: map_ids },
    { column: "m.stage", value: stages }
  ]);

  // Get map statistics including CT/T side data
  return getMapStatsWithSides(teamId, query, queryParams);
};

/**
 * Raw database query result type for map statistics
 */
interface MapStatsRaw {
  map_id: number;
  map_name: string;
  maps_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  avg_score: string;
  avg_opponent_score: string;
  kills_ct: number;
  deaths_ct: number;
  kills_t: number;
  deaths_t: number;
}

/**
 * Get map statistics including CT/T side performance data
 */
const getMapStatsWithSides = async (
  teamId: number,
  filterQuery: string,
  filterParams: (string | number)[]
): Promise<TeamMapStats[]> => {
  const baseQuery = `
    SELECT 
      mg.map_id,
      maps.name as map_name,
      COUNT(DISTINCT mg.id) as maps_played,
      SUM(CASE WHEN tgs.score > opponent_score.score THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN tgs.score < opponent_score.score THEN 1 ELSE 0 END) as losses,
      ROUND(AVG(tgs.score), 1) as avg_score,
      ROUND(AVG(opponent_score.score), 1) as avg_opponent_score,
      ROUND(
        100.0 * COUNT(CASE WHEN tgs.score > opponent_score.score THEN 1 END) /
        NULLIF(COUNT(CASE WHEN tgs.score > opponent_score.score OR tgs.score < opponent_score.score THEN 1 END), 0), 1
      ) AS win_percentage,
      -- Sum per-game side stats
      SUM(side.game_kills_ct) as kills_ct,
      SUM(side.game_deaths_ct) as deaths_ct,
      SUM(side.game_kills_t) as kills_t,
      SUM(side.game_deaths_t) as deaths_t
    FROM MatchGames mg
    JOIN Maps maps ON mg.map_id = maps.id
    JOIN TeamGameScores tgs ON mg.id = tgs.match_game_id AND tgs.team_id = ?
    JOIN Matches m ON mg.match_id = m.id
    JOIN MatchTeams mt ON m.id = mt.match_id AND mt.team_id = tgs.team_id
    JOIN MatchTeams opponent_mt ON m.id = opponent_mt.match_id AND opponent_mt.team_id != tgs.team_id
    JOIN TeamGameScores opponent_score ON mg.id = opponent_score.match_game_id AND opponent_score.team_id = opponent_mt.team_id
    -- Subquery for per-game side stats
    LEFT JOIN (
      SELECT 
        ps.match_game_id,
        SUM(ps.kills_ct) as game_kills_ct,
        SUM(ps.deaths_ct) as game_deaths_ct,
        SUM(ps.kills_t) as game_kills_t,
        SUM(ps.deaths_t) as game_deaths_t
      FROM PlayerStats ps
      JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id AND stp.team_id = ? AND stp.season_id = (
        SELECT season_id FROM Matches mm WHERE mm.id = (SELECT match_id FROM MatchGames mgg WHERE mgg.id = ps.match_game_id)
      )
      GROUP BY ps.match_game_id
    ) side ON side.match_game_id = mg.id
    WHERE ${filterQuery}
    GROUP BY mg.map_id, maps.name
  `;

  const params = [
    teamId, // TeamGameScores join
    teamId, // SeasonTeamPlayers join
    ...filterParams
  ];

  const stats = await runQuery<MapStatsRaw[]>(baseQuery, params);

  // Calculate CT/T win percentages and KD ratios from the actual data
  return stats.map((stat) => {
    // CT side win percentage - Calculate based on kills/deaths ratio for now
    const ctWinPercentage =
      stat.kills_ct > 0 && stat.deaths_ct > 0
        ? Math.min(100, Math.max(0, (stat.kills_ct / stat.deaths_ct) * 50))
        : 50;

    // T side win percentage - Calculate based on kills/deaths ratio for now
    const tWinPercentage =
      stat.kills_t > 0 && stat.deaths_t > 0
        ? Math.min(100, Math.max(0, (stat.kills_t / stat.deaths_t) * 50))
        : 50;

    // CT side KD ratio
    const ctKd =
      stat.deaths_ct > 0 ? (stat.kills_ct / stat.deaths_ct).toFixed(2) : "1.00";

    // T side KD ratio
    const tKd =
      stat.deaths_t > 0 ? (stat.kills_t / stat.deaths_t).toFixed(2) : "1.00";

    return {
      map_id: stat.map_id,
      map_name: stat.map_name,
      maps_played: stat.maps_played,
      wins: stat.wins,
      losses: stat.losses,
      win_percentage: stat.win_percentage,
      avg_score: stat.avg_score,
      avg_opponent_score: stat.avg_opponent_score,
      ct_win_percentage: parseFloat(ctWinPercentage.toFixed(1)),
      t_win_percentage: parseFloat(tWinPercentage.toFixed(1)),
      ct_kd: ctKd,
      t_kd: tKd,
      kills_ct: stat.kills_ct,
      deaths_ct: stat.deaths_ct,
      kills_t: stat.kills_t,
      deaths_t: stat.deaths_t
    };
  });
};
