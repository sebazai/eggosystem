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
    FROM MatchTeamMapVetoes mtmv
    JOIN Maps maps ON mtmv.map_id = maps.id
    JOIN Matches m ON mtmv.match_id = m.id
    WHERE mtmv.team_id = ?
      AND ${filterQuery}
    GROUP BY maps.id, maps.name
    ORDER BY maps.name ASC
  `;

  const params = [teamId, ...filterParams];

  const stats = await runQuery<MapVetoStatsRaw[]>(baseQuery, params);

  return stats.map((stat) => ({
    map_id: stat.map_id,
    map_name: stat.map_name,
    picks: stat.picks || 0,
    bans: stat.bans || 0
  }));
};
