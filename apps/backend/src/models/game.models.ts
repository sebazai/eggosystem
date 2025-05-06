import {
  type MatchTeamStats,
  type MapRoundInfo,
  type MatchGameTeamRoundBreakdown
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getMatchGameTeamRoundBreakdown = async (game_id: number) => {
  const query = `
   SELECT 
    rw.team_id,
    tgs.starting_side,
    SUM(CASE WHEN rw.round_number <= mg.regulation_rounds / 2 THEN 1 ELSE 0 END) AS rounds_won_first_half,
    SUM(CASE WHEN rw.round_number > mg.regulation_rounds / 2 AND rw.round_number <= mg.regulation_rounds THEN 1 ELSE 0 END) AS rounds_won_second_half,
    SUM(CASE WHEN rw.round_number <= mg.regulation_rounds THEN 1 ELSE 0 END) AS total_rounds_won,
    SUM(CASE WHEN rw.round_number > mg.regulation_rounds THEN 1 ELSE 0 END) AS total_overtime_rounds_won,
    SUM(CASE WHEN rw.round_number > mg.regulation_rounds AND rw.side = 'CT' THEN 1 ELSE 0 END) AS overtime_rounds_won_ct,
    SUM(CASE WHEN rw.round_number > mg.regulation_rounds AND rw.side = 'T' THEN 1 ELSE 0 END) AS overtime_rounds_won_t
  FROM (
    SELECT
      mrs.game_id,
      mrs.round_number,
      CASE 
        WHEN mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win') THEN mrs.ct_team_id
        WHEN mrs.round_end_reason_info IN ('target_bombed', 't_win') THEN mrs.t_team_id
      END AS team_id,
      CASE 
        WHEN mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win') THEN 'CT'
        WHEN mrs.round_end_reason_info IN ('target_bombed', 't_win') THEN 'T'
      END AS side
    FROM MapRoundStats mrs
    WHERE mrs.game_id = ?
  ) rw
  JOIN MatchGames mg ON mg.id = rw.game_id
  JOIN TeamGameScores tgs ON tgs.game_id = mg.id AND tgs.team_id = rw.team_id
  GROUP BY rw.team_id, mg.regulation_rounds, tgs.starting_side
  ORDER BY rw.team_id;
  `;

  const data = await runQuery<Array<MatchGameTeamRoundBreakdown>>(query, [
    game_id
  ]);
  return data;
};

export const getGameRoundInfo = async (game_id: number) => {
  const query = `
      SELECT 
        mrs.*,
        mg.regulation_rounds,
        ct.name AS ct_name,
        t.name AS t_name,
        ct.team_logo AS ct_logo,
        t.team_logo AS t_logo
      FROM MapRoundStats mrs
      JOIN MatchGames mg ON mg.id = mrs.game_id
      JOIN Teams ct ON ct.id = mrs.ct_team_id
      JOIN Teams t ON t.id = mrs.t_team_id
      WHERE mrs.game_id = ?
      ORDER BY round_number ASC
    `;
  return runQuery<MapRoundInfo[]>(query, [game_id]);
};

export const getMatchGameTeamStats = async (game_id: number) => {
  const query = `
      SELECT 
          tms.team_id,
          t.name,
          tms.score,
          tms.halftime_score as team_ht_score,
          tms.starting_side,
          COALESCE(SUM(ps.first_kills), 0) as first_kills,
          COALESCE(SUM(ps.clutches_won), 0) as clutches_won,
          COALESCE(SUM(ps.plants), 0) as plants,
          COALESCE(SUM(ps.trades), 0) as trades
      FROM MatchGames mmp
      JOIN TeamGameScores tms ON tms.game_id = mmp.id
      JOIN Teams t ON t.id = tms.team_id
      LEFT JOIN PlayerStats ps ON ps.game_id = mmp.id 
          AND ((ps.team = 1 AND tms.team_id = (
              SELECT team_id FROM TeamGameScores 
              WHERE game_id = mmp.id 
              ORDER BY team_id ASC LIMIT 1
          )) OR (ps.team = 2 AND tms.team_id = (
              SELECT team_id FROM TeamGameScores 
              WHERE game_id = mmp.id 
              ORDER BY team_id DESC LIMIT 1
          )))
      WHERE mmp.id = ?
      GROUP BY tms.team_id, t.name, tms.score, tms.halftime_score, tms.starting_side
      ORDER BY tms.team_id`;

  return runQuery<MatchTeamStats[]>(query, [game_id]);
};
