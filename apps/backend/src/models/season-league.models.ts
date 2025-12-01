import { type SeasonLeague } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getSeasonLeagueBySeasonAndFaceitName = async (
  seasonId: number,
  leagueName: string
) => {
  const isLeagueNameNumeric = !isNaN(Number(leagueName));
  const leagueFullName = isLeagueNameNumeric ? `div${leagueName}` : leagueName;
  const query = `SELECT * FROM SeasonLeagues sl
    JOIN Leagues l ON sl.league_id = l.id
    WHERE sl.season_id = ? AND l.name = ?
  `;
  const [seasonLeague] = await runQuery<Array<SeasonLeague | undefined>>(
    query,
    [seasonId, leagueFullName]
  );
  return seasonLeague;
};

export const getSeasonLeaguesWithMappingsBySeasonId = async (
  seasonId: number,
  connection?: PoolConnection
) => {
  const query = `
    SELECT 
      sl.season_id,
      sl.league_id,
      sl.tier,
      l.name as league_name,
      COUNT(slei.id) as mappings_count,
      JSON_ARRAYAGG(
        CASE 
          WHEN slei.id IS NOT NULL THEN JSON_OBJECT(
            'id', slei.id,
            'season_id', slei.season_id,
            'league_id', slei.league_id,
            'external_id', slei.external_id,
            'external_league_name', slei.external_league_name,
            'stage_id', slei.stage_id,
            'type', slei.type,
            'manual_group', slei.manual_group
          )
          ELSE NULL
        END
      ) as mappings
    FROM SeasonLeagues sl
    JOIN Leagues l ON sl.league_id = l.id
    LEFT JOIN SeasonLeagueExternalIds slei ON sl.season_id = slei.season_id AND sl.league_id = slei.league_id
    WHERE sl.season_id = ?
    GROUP BY sl.season_id, sl.league_id, sl.tier, l.name
    ORDER BY sl.tier ASC
  `;

  const results = await runQuery<
    Array<{
      season_id: number;
      league_id: number;
      tier: number;
      league_name: string;
      mappings_count: number;
      mappings: string;
    }>
  >(query, [seasonId], connection);

  return results;
};
