import { type TeamMapStats, type ParsedParams } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { generateQueryWithFilters } from "../utils/queryFilter";

/**
 * Get all maps from the active map pool for the filtered seasons
 * @param seasonIds Array of season IDs to get active map pool for
 * @returns Promise resolving to an array of { map_id, map_name } objects
 */
const getActiveMapPoolMaps = async (
  seasonIds?: number[] | null
): Promise<Array<{ map_id: number; map_name: string }>> => {
  if (!seasonIds || seasonIds.length === 0) {
    // If no seasons specified, return empty array (won't complement data)
    return [];
  }

  const placeholders = seasonIds.map(() => "?").join(", ");
  const query = `
    SELECT DISTINCT m.id as map_id, m.name as map_name
    FROM SeasonActiveMapPool samp
    JOIN Maps m ON samp.map_id = m.id
    WHERE samp.season_id IN (${placeholders})
    ORDER BY m.name ASC
  `;

  return runQuery<Array<{ map_id: number; map_name: string }>>(
    query,
    seasonIds
  );
};

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
  const stats = await getMapStatsWithSides(teamId, query, queryParams);

  // Only complement with map pool if:
  // 1. Seasons are specified (to know which pool to use)
  // 2. No specific maps are filtered (user wants to see all maps)
  // 3. Team has at least some activity (not a non-existent team)
  const shouldComplement =
    season_ids &&
    season_ids.length > 0 &&
    (!map_ids || map_ids.length === 0) &&
    stats.length > 0;

  if (shouldComplement) {
    const activeMapPool = await getActiveMapPoolMaps(season_ids);
    if (activeMapPool.length > 0) {
      return complementStatsWithMapPool(stats, activeMapPool);
    }
  }

  return stats;
};

/**
 * Complement stats with complete map pool, filling in zeros for unplayed maps
 * @param stats Existing stats from database
 * @param mapPool Complete map pool from SeasonActiveMapPool
 * @returns Complete stats array with all maps from pool in alphabetical order
 */
const complementStatsWithMapPool = (
  stats: TeamMapStats[],
  mapPool: Array<{ map_id: number; map_name: string }>
): TeamMapStats[] => {
  // Create a map for quick lookup of existing stats
  const statsMap = new Map(stats.map((s) => [s.map_id, s]));

  // Create stats for all maps in the pool
  const completeStats = mapPool.map((poolMap) => {
    const existingStat = statsMap.get(poolMap.map_id);
    if (existingStat) {
      return existingStat;
    }

    // Return zero values for unplayed maps
    return {
      map_id: poolMap.map_id,
      map_name: poolMap.map_name,
      maps_played: 0,
      wins: 0,
      losses: 0,
      win_percentage: 0,
      avg_score: "0.0",
      avg_opponent_score: "0.0",
      ct_win_percentage: 50,
      t_win_percentage: 50,
      ct_kd: "0.00",
      t_kd: "0.00",
      kills_ct: 0,
      deaths_ct: 0,
      kills_t: 0,
      deaths_t: 0,
      first_kills: 0,
      first_deaths: 0,
      first_kills_t: 0,
      first_deaths_t: 0,
      first_kills_ct: 0,
      first_deaths_ct: 0,
      fk_5v4_won: 0,
      fk_5v4_total: 0,
      fk_4v5_won: 0,
      fk_4v5_total: 0,
      fk_5v4_won_ct: 0,
      fk_5v4_total_ct: 0,
      fk_5v4_won_t: 0,
      fk_5v4_total_t: 0,
      fk_4v5_won_ct: 0,
      fk_4v5_total_ct: 0,
      fk_4v5_won_t: 0,
      fk_4v5_total_t: 0
    } satisfies TeamMapStats;
  });

  // Sort by map name alphabetically (already sorted from query, but ensure)
  return completeStats.sort((a, b) => a.map_name.localeCompare(b.map_name));
};

/**
 * Raw database query result types for separate queries
 */
interface BaseMapStats {
  map_id: number;
  map_name: string;
  maps_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  avg_score: string;
  avg_opponent_score: string;
}

interface SideStats {
  map_id: number;
  kills_ct: number;
  deaths_ct: number;
  kills_t: number;
  deaths_t: number;
  first_kills: number;
  first_deaths: number;
  first_kills_t: number;
  first_deaths_t: number;
  first_kills_ct: number;
  first_deaths_ct: number;
}

interface AdvantageStats {
  map_id: number;
  fk_5v4_won: number;
  fk_5v4_total: number;
  fk_4v5_won: number;
  fk_4v5_total: number;
  fk_5v4_won_ct: number;
  fk_5v4_total_ct: number;
  fk_5v4_won_t: number;
  fk_5v4_total_t: number;
  fk_4v5_won_ct: number;
  fk_4v5_total_ct: number;
  fk_4v5_won_t: number;
  fk_4v5_total_t: number;
}

const getMapStatsWithSides = async (
  teamId: number,
  filterQuery: string,
  filterParams: (string | number)[]
): Promise<TeamMapStats[]> => {
  // Query 1: Base map statistics (wins, losses, maps played, scores)
  const baseStatsQuery = `
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
      ) AS win_percentage
    FROM MatchGames mg
    JOIN Maps maps ON mg.map_id = maps.id
    JOIN TeamGameScores tgs ON mg.id = tgs.match_game_id AND tgs.team_id = ?
    JOIN Matches m ON mg.match_id = m.id
    JOIN MatchTeams mt ON m.id = mt.match_id AND mt.team_id = ?
    JOIN MatchTeams opponent_mt ON m.id = opponent_mt.match_id AND opponent_mt.team_id != ?
    JOIN TeamGameScores opponent_score ON mg.id = opponent_score.match_game_id AND opponent_score.team_id = opponent_mt.team_id
    WHERE ${filterQuery}
    GROUP BY mg.map_id, maps.name
    ORDER BY maps.name ASC
  `;

  // Query 2: Side-specific stats (kills/deaths by side, first kills/deaths)
  const sideStatsQuery = `
    SELECT 
      mg.map_id,
      COALESCE(SUM(ps.kills_ct), 0) as kills_ct,
      COALESCE(SUM(ps.deaths_ct), 0) as deaths_ct,
      COALESCE(SUM(ps.kills_t), 0) as kills_t,
      COALESCE(SUM(ps.deaths_t), 0) as deaths_t,
      COALESCE(SUM(ps.first_kills), 0) as first_kills,
      COALESCE(SUM(ps.first_deaths), 0) as first_deaths,
      COALESCE(SUM(ps.first_kills_t), 0) as first_kills_t,
      COALESCE(SUM(ps.first_deaths_t), 0) as first_deaths_t,
      COALESCE(SUM(ps.first_kills_ct), 0) as first_kills_ct,
      COALESCE(SUM(ps.first_deaths_ct), 0) as first_deaths_ct
    FROM MatchGames mg
    JOIN Matches m ON mg.match_id = m.id
    JOIN PlayerStats ps ON ps.match_game_id = mg.id
    JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id AND stp.season_id = m.season_id
    WHERE stp.team_id = ? AND ${filterQuery}
    GROUP BY mg.map_id
  `;

  // Query 3: Advantage stats (5v4/4v5 from MapRoundStats)
  // Use derived table to pass teamId once and reference it throughout
  const advantageStatsQuery = `
    SELECT 
      mg.map_id,
      -- Overall 5v4/4v5 stats
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_5v4_won_ct_raw ELSE adv.fk_5v4_won_t_raw END), 0) as fk_5v4_won,
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_5v4_total_ct_raw ELSE adv.fk_5v4_total_t_raw END), 0) as fk_5v4_total,
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_4v5_won_ct_raw ELSE adv.fk_4v5_won_t_raw END), 0) as fk_4v5_won,
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_4v5_total_ct_raw ELSE adv.fk_4v5_total_t_raw END), 0) as fk_4v5_total,
      -- Split by side
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_5v4_won_ct_raw ELSE 0 END), 0) as fk_5v4_won_ct,
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_5v4_total_ct_raw ELSE 0 END), 0) as fk_5v4_total_ct,
      COALESCE(SUM(CASE WHEN adv.t_team_id = p.tid THEN adv.fk_5v4_won_t_raw ELSE 0 END), 0) as fk_5v4_won_t,
      COALESCE(SUM(CASE WHEN adv.t_team_id = p.tid THEN adv.fk_5v4_total_t_raw ELSE 0 END), 0) as fk_5v4_total_t,
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_4v5_won_ct_raw ELSE 0 END), 0) as fk_4v5_won_ct,
      COALESCE(SUM(CASE WHEN adv.ct_team_id = p.tid THEN adv.fk_4v5_total_ct_raw ELSE 0 END), 0) as fk_4v5_total_ct,
      COALESCE(SUM(CASE WHEN adv.t_team_id = p.tid THEN adv.fk_4v5_won_t_raw ELSE 0 END), 0) as fk_4v5_won_t,
      COALESCE(SUM(CASE WHEN adv.t_team_id = p.tid THEN adv.fk_4v5_total_t_raw ELSE 0 END), 0) as fk_4v5_total_t
    FROM (SELECT ? as tid) p
    CROSS JOIN MatchGames mg
    JOIN Matches m ON mg.match_id = m.id
    LEFT JOIN (
      SELECT 
        mrs.match_game_id,
        mrs.ct_team_id,
        mrs.t_team_id,
        SUM(CASE 
          WHEN mrs.first_kill = 'CT' AND mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win')
          THEN 1 ELSE 0 
        END) as fk_5v4_won_ct_raw,
        SUM(CASE 
          WHEN mrs.first_kill = 'T' AND mrs.round_end_reason_info IN ('target_bombed', 't_win')
          THEN 1 ELSE 0 
        END) as fk_5v4_won_t_raw,
        SUM(CASE WHEN mrs.first_kill = 'CT' THEN 1 ELSE 0 END) as fk_5v4_total_ct_raw,
        SUM(CASE WHEN mrs.first_kill = 'T' THEN 1 ELSE 0 END) as fk_5v4_total_t_raw,
        SUM(CASE 
          WHEN mrs.first_kill = 'T' AND mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win')
          THEN 1 ELSE 0 
        END) as fk_4v5_won_ct_raw,
        SUM(CASE 
          WHEN mrs.first_kill = 'CT' AND mrs.round_end_reason_info IN ('target_bombed', 't_win')
          THEN 1 ELSE 0 
        END) as fk_4v5_won_t_raw,
        SUM(CASE WHEN mrs.first_kill = 'T' THEN 1 ELSE 0 END) as fk_4v5_total_ct_raw,
        SUM(CASE WHEN mrs.first_kill = 'CT' THEN 1 ELSE 0 END) as fk_4v5_total_t_raw
      FROM MapRoundStats mrs
      WHERE mrs.first_kill IS NOT NULL
      GROUP BY mrs.match_game_id, mrs.ct_team_id, mrs.t_team_id
    ) adv ON adv.match_game_id = mg.id AND (adv.ct_team_id = p.tid OR adv.t_team_id = p.tid)
    WHERE ${filterQuery}
    GROUP BY mg.map_id
  `;

  // Execute all queries in parallel
  const [baseStatsResult, sideStatsResult, advantageStatsResult] =
    await Promise.allSettled([
      runQuery<BaseMapStats[]>(baseStatsQuery, [
        teamId,
        teamId,
        teamId,
        ...filterParams
      ]),
      runQuery<SideStats[]>(sideStatsQuery, [teamId, ...filterParams]),
      runQuery<AdvantageStats[]>(advantageStatsQuery, [teamId, ...filterParams])
    ]);

  // Extract results, using empty arrays as fallback if a query failed
  const baseStats =
    baseStatsResult.status === "fulfilled"
      ? baseStatsResult.value
      : (console.error("Base stats query failed:", baseStatsResult.reason),
        [] as BaseMapStats[]);
  const sideStats =
    sideStatsResult.status === "fulfilled"
      ? sideStatsResult.value
      : (console.error("Side stats query failed:", sideStatsResult.reason),
        [] as SideStats[]);
  const advantageStats =
    advantageStatsResult.status === "fulfilled"
      ? advantageStatsResult.value
      : (console.error(
          "Advantage stats query failed:",
          advantageStatsResult.reason
        ),
        [] as AdvantageStats[]);

  // Create maps for quick lookup
  const sideStatsMap = new Map(sideStats.map((s) => [s.map_id, s]));
  const advantageStatsMap = new Map(advantageStats.map((a) => [a.map_id, a]));

  // Combine the results
  const stats = baseStats.map((base) => {
    const side = sideStatsMap.get(base.map_id) ?? {
      map_id: base.map_id,
      kills_ct: 0,
      deaths_ct: 0,
      kills_t: 0,
      deaths_t: 0,
      first_kills: 0,
      first_deaths: 0,
      first_kills_t: 0,
      first_deaths_t: 0,
      first_kills_ct: 0,
      first_deaths_ct: 0
    };

    const adv = advantageStatsMap.get(base.map_id) ?? {
      map_id: base.map_id,
      fk_5v4_won: 0,
      fk_5v4_total: 0,
      fk_4v5_won: 0,
      fk_4v5_total: 0,
      fk_5v4_won_ct: 0,
      fk_5v4_total_ct: 0,
      fk_5v4_won_t: 0,
      fk_5v4_total_t: 0,
      fk_4v5_won_ct: 0,
      fk_4v5_total_ct: 0,
      fk_4v5_won_t: 0,
      fk_4v5_total_t: 0
    };

    // Calculate CT/T win percentages and KD ratios from the actual data
    const ctWinPercentage =
      side.kills_ct > 0 && side.deaths_ct > 0
        ? Math.min(100, Math.max(0, (side.kills_ct / side.deaths_ct) * 50))
        : 50;

    const tWinPercentage =
      side.kills_t > 0 && side.deaths_t > 0
        ? Math.min(100, Math.max(0, (side.kills_t / side.deaths_t) * 50))
        : 50;

    const ctKd =
      side.deaths_ct > 0 ? (side.kills_ct / side.deaths_ct).toFixed(2) : "1.00";

    const tKd =
      side.deaths_t > 0 ? (side.kills_t / side.deaths_t).toFixed(2) : "1.00";

    return {
      map_id: base.map_id,
      map_name: base.map_name,
      maps_played: base.maps_played,
      wins: base.wins,
      losses: base.losses,
      win_percentage: base.win_percentage,
      avg_score: base.avg_score,
      avg_opponent_score: base.avg_opponent_score,
      ct_win_percentage: parseFloat(ctWinPercentage.toFixed(1)),
      t_win_percentage: parseFloat(tWinPercentage.toFixed(1)),
      ct_kd: ctKd,
      t_kd: tKd,
      kills_ct: side.kills_ct,
      deaths_ct: side.deaths_ct,
      kills_t: side.kills_t,
      deaths_t: side.deaths_t,
      first_kills: side.first_kills,
      first_deaths: side.first_deaths,
      first_kills_t: side.first_kills_t,
      first_deaths_t: side.first_deaths_t,
      first_kills_ct: side.first_kills_ct,
      first_deaths_ct: side.first_deaths_ct,
      fk_5v4_won: adv.fk_5v4_won,
      fk_5v4_total: adv.fk_5v4_total,
      fk_4v5_won: adv.fk_4v5_won,
      fk_4v5_total: adv.fk_4v5_total,
      fk_5v4_won_ct: adv.fk_5v4_won_ct,
      fk_5v4_total_ct: adv.fk_5v4_total_ct,
      fk_5v4_won_t: adv.fk_5v4_won_t,
      fk_5v4_total_t: adv.fk_5v4_total_t,
      fk_4v5_won_ct: adv.fk_4v5_won_ct,
      fk_4v5_total_ct: adv.fk_4v5_total_ct,
      fk_4v5_won_t: adv.fk_4v5_won_t,
      fk_4v5_total_t: adv.fk_4v5_total_t
    };
  });

  return stats;
};
