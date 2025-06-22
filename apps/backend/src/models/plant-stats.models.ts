import { runQuery } from "../db/mysqlRunQuery";
import { type ParsedParams, type TeamPlantStat } from "@eggosystem/types";
import { generateQueryWithFilters } from "../utils/queryFilter";

export const getTeamPlantStats = async (
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
      
      -- Offensive plants (team as T-side)
      COUNT(DISTINCT CASE 
          WHEN mrs.t_team_id = t.id AND mrs.plant_site = 'A'
          THEN mrs.id 
      END) AS planted_a_site,
      
      COUNT(DISTINCT CASE 
          WHEN mrs.t_team_id = t.id AND mrs.plant_site = 'B'
          THEN mrs.id 
      END) AS planted_b_site,
      
      -- Count rounds where team was T but didn't plant
      (
        COUNT(DISTINCT CASE 
            WHEN mrs.t_team_id = t.id 
            THEN mrs.id 
        END) -
        COUNT(DISTINCT CASE 
            WHEN mrs.t_team_id = t.id AND mrs.plant_site IN ('A', 'B')
            THEN mrs.id 
        END)
      ) AS no_plants,
      
      -- Defensive (enemy as T-side)
      COUNT(DISTINCT CASE 
          WHEN mrs.ct_team_id = t.id AND mrs.plant_site = 'A'
          THEN mrs.id 
      END) AS enemy_planted_a_site,
      
      COUNT(DISTINCT CASE 
          WHEN mrs.ct_team_id = t.id AND mrs.plant_site = 'B'
          THEN mrs.id 
      END) AS enemy_planted_b_site,
      
      -- Count rounds where enemy was T but didn't plant
      (
        COUNT(DISTINCT CASE 
            WHEN mrs.ct_team_id = t.id 
            THEN mrs.id 
        END) -
        COUNT(DISTINCT CASE 
            WHEN mrs.ct_team_id = t.id AND mrs.plant_site IN ('A', 'B')
            THEN mrs.id 
        END)
      ) AS enemy_no_plants
      
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

  return runQuery<TeamPlantStat[]>(baseQuery, params);
};
