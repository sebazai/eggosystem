import { type TeamMapVetoStats, type ParsedParams } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { generateQueryWithFilters } from "../utils/queryFilter";

/**
 * Raw database query result type for map veto statistics
 */
interface MapVetoStatsRaw {
  map_id: number;
  map_name: string;
  picks: number;
  bans: number;
}

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
 * Complement veto stats with complete map pool
 * @param stats Existing stats from database
 * @param mapPool Complete map pool from SeasonActiveMapPool
 * @returns Complete stats array with all maps from pool in alphabetical order
 */
const complementVetoStats = (
  stats: TeamMapVetoStats[],
  mapPool: Array<{ map_id: number; map_name: string }>
): TeamMapVetoStats[] => {
  // Create a map for quick lookup of existing stats
  const statsMap = new Map(stats.map((s) => [s.map_id, s]));

  // Create stats for all maps in the pool
  const completeStats = mapPool.map((poolMap) => {
    const existingStat = statsMap.get(poolMap.map_id);
    if (existingStat) {
      return existingStat;
    }

    // Return zero values for maps without veto data
    return {
      map_id: poolMap.map_id,
      map_name: poolMap.map_name,
      picks: 0,
      bans: 0
    } satisfies TeamMapVetoStats;
  });

  // Sort by map name alphabetically (already sorted from query, but ensure)
  return completeStats.sort((a, b) => a.map_name.localeCompare(b.map_name));
};

/**
 * Get aggregated map veto statistics for a team (picks and bans per map)
 * @param teamId The ID of the team to get stats for
 * @param filters Filters to apply to the query (season, league, stage)
 * @returns Promise resolving to an array of TeamMapVetoStats objects
 */
export const getTeamMapVetoStats = async (
  teamId: number,
  filters: ParsedParams
): Promise<TeamMapVetoStats[]> => {
  const { season_ids, league_ids, stages } = filters;

  // Generate the filter query parts
  const { query: filterQuery, queryParams: filterParams } =
    generateQueryWithFilters([
      { column: "m.season_id", value: season_ids },
      { column: "m.league_id", value: league_ids },
      { column: "m.stage", value: stages }
    ]);

  const baseQuery = `
    SELECT 
      maps.id as map_id,
      maps.name as map_name,
      SUM(CASE WHEN mtmv.action IN ('pick', 'decider') THEN 1 ELSE 0 END) as picks,
      SUM(CASE WHEN mtmv.action = 'drop' THEN 1 ELSE 0 END) as bans
    FROM (
      SELECT DISTINCT
        mtmv.team_id,
        mtmv.map_id,
        mtmv.action,
        COALESCE(m.external_match_room_id, CAST(m.id AS CHAR)) as match_identifier
      FROM MatchTeamMapVetoes mtmv
      JOIN Matches m ON mtmv.match_id = m.id
      WHERE mtmv.team_id = ?
        AND ${filterQuery}
    ) as mtmv
    JOIN Maps maps ON mtmv.map_id = maps.id
    GROUP BY maps.id, maps.name
    ORDER BY maps.name ASC
  `;

  const params = [teamId, ...filterParams];

  const stats = await runQuery<MapVetoStatsRaw[]>(baseQuery, params);

  const mappedStats = stats.map((stat) => ({
    map_id: stat.map_id,
    map_name: stat.map_name,
    picks: stat.picks || 0,
    bans: stat.bans || 0
  }));

  // Only complement with map pool if:
  // 1. Seasons are specified
  // 2. Team has at least some veto activity (not a non-existent team)
  const shouldComplement =
    season_ids && season_ids.length > 0 && mappedStats.length > 0;

  if (shouldComplement) {
    const activeMapPool = await getActiveMapPoolMaps(season_ids);
    if (activeMapPool.length > 0) {
      return complementVetoStats(mappedStats, activeMapPool);
    }
  }

  return mappedStats;
};
