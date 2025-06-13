import { runQuery } from "../db/mysqlRunQuery";
import { type ParsedParams, type TeamPistolWinStat } from "@eggosystem/types";
import { generateQueryWithFilters } from "../utils/queryFilter";

export const getTeamPistolWins = async (
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
        COUNT(DISTINCT CASE 
            WHEN mrs.round_number = 1 OR mrs.round_number = CASE 
                WHEN mg.regulation_rounds = 30 THEN 16 
                ELSE 13 
            END 
            THEN mrs.id 
        END) AS pistol_rounds_played,
        COUNT(DISTINCT CASE 
            WHEN (mrs.round_number = 1 OR mrs.round_number = CASE 
                WHEN mg.regulation_rounds = 30 THEN 16 
                ELSE 13 
            END)
            AND ((mrs.ct_team_id = t.id AND mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win')) 
               OR (mrs.t_team_id = t.id AND mrs.round_end_reason_info IN ('target_bombed', 't_win')))
            THEN mrs.id 
        END) AS pistol_rounds_won,
        ROUND(
            100.0 * COUNT(DISTINCT CASE 
                WHEN (mrs.round_number = 1 OR mrs.round_number = CASE 
                    WHEN mg.regulation_rounds = 30 THEN 16 
                    ELSE 13 
                END)
                AND ((mrs.ct_team_id = t.id AND mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win')) 
                   OR (mrs.t_team_id = t.id AND mrs.round_end_reason_info IN ('target_bombed', 't_win')))
                THEN mrs.id 
            END) / NULLIF(COUNT(DISTINCT CASE 
                WHEN mrs.round_number = 1 OR mrs.round_number = CASE 
                    WHEN mg.regulation_rounds = 30 THEN 16 
                    ELSE 13 
                END 
                THEN mrs.id 
            END), 0), 1
        ) AS pistol_win_percentage
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
        (mrs.round_number = 1 OR mrs.round_number = CASE WHEN mg.regulation_rounds = 30 THEN 16 ELSE 13 END)
        AND ${query}
    GROUP BY
        m.season_id,
        s.name,
        maps.id,
        maps.name,
        t.id,
        t.name
    ORDER BY pistol_win_percentage DESC, pistol_rounds_won DESC
  `;

  return runQuery<TeamPistolWinStat[]>(baseQuery, queryParams);
};
