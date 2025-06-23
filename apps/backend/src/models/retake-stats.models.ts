import { runQuery } from "../db/mysqlRunQuery";
import { type ParsedParams, type TeamRetakeStats } from "@eggosystem/types";
import { generateQueryWithFilters } from "../utils/queryFilter";

export const getTeamRetakeStats = async (
  teamId: number,
  { season_ids, map_ids, stages }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "maps.id",
      value: map_ids
    },
    { column: "m.stage", value: stages },
    { column: "t.id", value: [teamId] }
  ]);

  const baseQuery = `
    SELECT 
      m.season_id,
      s.name AS season_name,
      maps.id AS map_id,
      maps.name AS map_name,
      t.id AS team_id,
      t.name AS team_name,
      
      -- Afterplant stats (team is T and planted)
      COUNT(DISTINCT CASE 
          WHEN mrs.t_team_id = t.id AND mrs.plant_site IN ('A', 'B')
          THEN mrs.id 
      END) AS afterplant_total,
      
      COUNT(DISTINCT CASE 
          WHEN mrs.t_team_id = t.id AND mrs.plant_site IN ('A', 'B') 
          AND (mrs.round_end_reason_info = 'bomb_exploded' OR mrs.round_end_reason_info LIKE '%T_WIN%')
          THEN mrs.id 
      END) AS afterplant_won,
      
      -- Retake stats (team is CT and enemy planted)
      COUNT(DISTINCT CASE 
          WHEN mrs.ct_team_id = t.id AND mrs.plant_site IN ('A', 'B')
          THEN mrs.id 
      END) AS retake_total,
      
      COUNT(DISTINCT CASE 
          WHEN mrs.ct_team_id = t.id AND mrs.plant_site IN ('A', 'B') 
          AND mrs.round_end_reason_info = 'bomb_defused'
          THEN mrs.id 
      END) AS retake_won
      
    FROM
      MapRoundStats mrs
    JOIN
      MatchGames mg ON mrs.game_id = mg.id
    JOIN
      Matches m ON mg.match_id = m.id
    JOIN
      Maps maps ON mg.map_id = maps.id
    JOIN
      Seasons s ON m.season_id = s.id
    JOIN
      Teams t ON t.id IN (mrs.ct_team_id, mrs.t_team_id)
    WHERE
      ${query}
    GROUP BY
      m.season_id, s.name, maps.id, maps.name, t.id, t.name
    ORDER BY
      s.name DESC, maps.name
  `;

  const params = [...queryParams];

  // Run the query and calculate percentages
  const results = await runQuery<
    Omit<
      TeamRetakeStats,
      "afterplant_win_percentage" | "retake_win_percentage"
    >[]
  >(baseQuery, params);

  // Calculate win percentages
  return results.map((stats) => {
    return {
      ...stats,
      afterplant_win_percentage:
        stats.afterplant_total > 0
          ? Math.round((stats.afterplant_won / stats.afterplant_total) * 100)
          : 0,
      retake_win_percentage:
        stats.retake_total > 0
          ? Math.round((stats.retake_won / stats.retake_total) * 100)
          : 0
    };
  });
};
