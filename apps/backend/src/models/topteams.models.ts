import type { ParsedParams, TopTeamsByFiltersRaw } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { generateQueryWithFilters } from "../utils/queryFilter";

export const getTopTeams = async ({
  stages,
  map_ids,
  league_ids,
  season_ids
}: ParsedParams) => {
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_ids },
    { column: "m.league_id", value: league_ids },
    { column: "m.stage", value: stages },
    { column: "mmp.map_id", value: map_ids }
  ]);

  const baseQuery = `
    WITH TeamAverages AS (
      SELECT 
        t.id as team_id,
        t.name as team_name,
        CONCAT('/teams/', COALESCE(t.team_logo, 'nologo.svg')) as team_logo,
        l.name as league_name,
        l.id as league_id,
        l.sort_priority as league_sort_priority,
        m.stage as stage,
        COUNT(DISTINCT mmp.id) as matches_played,
        AVG(ps.kana_rating) as avg_kana_rating,
        ROW_NUMBER() OVER (PARTITION BY l.id, m.stage ORDER BY AVG(ps.kana_rating) DESC) as rank
      FROM Teams t
      JOIN MatchTeams mt ON mt.team_id = t.id
      JOIN Matches m ON m.id = mt.match_id
      JOIN Leagues l ON l.id = m.league_id
      JOIN MatchGames mmp ON mmp.match_id = m.id
      JOIN PlayerStats ps ON ps.game_id = mmp.id
      JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id 
        AND stp.team_id = t.id 
        AND stp.season_id = m.season_id
      WHERE ${query}
      GROUP BY t.id, t.name, t.team_logo, l.id, l.name, m.stage
    )
    SELECT 
      league_id,
      league_name,
      league_sort_priority,
      stage,
      CONCAT('[', GROUP_CONCAT(
        JSON_OBJECT(
          'team_id', team_id,
          'team_name', team_name,
          'team_logo', team_logo,
          'matches_played', matches_played,
          'kana', ROUND(avg_kana_rating, 3),
          'rank', rank
        ) ORDER BY rank, team_name
      ), ']') AS teams
    FROM TeamAverages
    WHERE rank <= 5
    GROUP BY league_id, league_name, league_sort_priority, stage
    ORDER BY league_sort_priority, stage;
  `;

  const results = await runQuery<TopTeamsByFiltersRaw[]>(
    baseQuery,
    queryParams
  );

  return results;
};
