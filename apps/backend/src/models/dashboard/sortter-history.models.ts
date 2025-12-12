import { runQuery } from "../../db/mysqlRunQuery";
import type { TeamHistoricalPerformance } from "@eggosystem/types";

/**
 * Minimum number of matching players to consider teams as "the same core"
 */
const MIN_MATCHING_PLAYERS = 4;

/**
 * Get historical performance for a team by finding previous seasons where
 * the core roster (4+ matching players) played together.
 *
 * @param currentSeasonId The current season we're checking from
 * @param teamId The team ID to find history for
 * @returns Array of historical performance records, sorted by season_id desc
 */
export const getTeamHistoricalPerformance = async (
  currentSeasonId: number,
  teamId: number
): Promise<TeamHistoricalPerformance[]> => {
  // This query:
  // 1. Gets current team's registered players
  // 2. Finds teams in earlier seasons with 4+ matching players
  // 3. Calculates wins/losses and avg round scores for regular season (stage=2)
  const query = `
    WITH CurrentTeamPlayers AS (
      -- Get steam_ids of players registered for the current team in current season
      SELECT DISTINCT steam_id
      FROM SeasonTeamRegistrationPlayers
      WHERE season_id = ? AND team_id = ?
    ),
    MatchingTeams AS (
      -- Find teams in earlier seasons that share 4+ players with current team
      SELECT 
        strp.season_id,
        strp.team_id,
        COUNT(DISTINCT strp.steam_id) AS matching_players
      FROM SeasonTeamRegistrationPlayers strp
      INNER JOIN CurrentTeamPlayers ctp ON ctp.steam_id = strp.steam_id
      WHERE strp.season_id < ?
      GROUP BY strp.season_id, strp.team_id
      HAVING matching_players >= ?
    ),
    TeamMatchStats AS (
      -- Calculate wins/losses and round scores for matched teams (regular season only)
      SELECT 
        mt.season_id,
        mt.team_id,
        mt.matching_players,
        t.name AS team_name,
        s.name AS season_name,
        COALESCE(slt.league_id, 0) AS league_id,
        COALESCE(l.name, 'Unknown') AS league_name,
        -- Count wins (matches where this team won more games)
        COALESCE(SUM(
          CASE 
            WHEN team_score.wins > opponent_score.wins THEN 1
            ELSE 0
          END
        ), 0) AS wins,
        -- Count losses (matches where opponent won more games)
        COALESCE(SUM(
          CASE 
            WHEN team_score.wins < opponent_score.wins THEN 1
            ELSE 0
          END
        ), 0) AS losses,
        -- Average rounds won per map
        COALESCE(ROUND(AVG(tgs.score), 1), 0) AS avg_rounds_won,
        -- Average rounds lost per map  
        COALESCE(ROUND(AVG(opp_tgs.score), 1), 0) AS avg_rounds_lost
      FROM MatchingTeams mt
      INNER JOIN Teams t ON t.id = mt.team_id
      INNER JOIN Seasons s ON s.id = mt.season_id
      LEFT JOIN SeasonLeagueTeams slt ON slt.team_id = mt.team_id AND slt.season_id = mt.season_id
      LEFT JOIN Leagues l ON l.id = slt.league_id
      -- Join to matches where this team played (regular season only)
      LEFT JOIN MatchTeams mteam ON mteam.team_id = mt.team_id
      LEFT JOIN Matches m ON m.id = mteam.match_id 
        AND m.season_id = mt.season_id 
        AND m.stage = 1  -- Regular season only (stage 1 = Regular, 2 = Playoff)
      -- Get opponent in same match
      LEFT JOIN MatchTeams opp_mteam ON opp_mteam.match_id = m.id 
        AND opp_mteam.team_id != mt.team_id
      -- Calculate game wins per match for determining match winner
      LEFT JOIN (
        SELECT 
          mg.match_id,
          tgs_inner.team_id,
          SUM(CASE WHEN tgs_inner.score > opp_inner.score THEN 1 ELSE 0 END) AS wins
        FROM MatchGames mg
        INNER JOIN TeamGameScores tgs_inner ON tgs_inner.match_game_id = mg.id
        INNER JOIN TeamGameScores opp_inner ON opp_inner.match_game_id = mg.id 
          AND opp_inner.team_id != tgs_inner.team_id
        GROUP BY mg.match_id, tgs_inner.team_id
      ) team_score ON team_score.match_id = m.id AND team_score.team_id = mt.team_id
      LEFT JOIN (
        SELECT 
          mg.match_id,
          tgs_inner.team_id,
          SUM(CASE WHEN tgs_inner.score > opp_inner.score THEN 1 ELSE 0 END) AS wins
        FROM MatchGames mg
        INNER JOIN TeamGameScores tgs_inner ON tgs_inner.match_game_id = mg.id
        INNER JOIN TeamGameScores opp_inner ON opp_inner.match_game_id = mg.id 
          AND opp_inner.team_id != tgs_inner.team_id
        GROUP BY mg.match_id, tgs_inner.team_id
      ) opponent_score ON opponent_score.match_id = m.id AND opponent_score.team_id = opp_mteam.team_id
      -- Get round scores per map
      LEFT JOIN MatchGames mg ON mg.match_id = m.id
      LEFT JOIN TeamGameScores tgs ON tgs.match_game_id = mg.id AND tgs.team_id = mt.team_id
      LEFT JOIN TeamGameScores opp_tgs ON opp_tgs.match_game_id = mg.id AND opp_tgs.team_id = opp_mteam.team_id
      GROUP BY mt.season_id, mt.team_id, mt.matching_players, t.name, s.name, slt.league_id, l.name
    )
    SELECT 
      team_id AS matched_team_id,
      team_name AS matched_team_name,
      season_id,
      season_name,
      league_id,
      league_name,
      wins,
      losses,
      avg_rounds_won,
      avg_rounds_lost,
      matching_players
    FROM TeamMatchStats
    ORDER BY season_id DESC;
  `;

  const results = await runQuery<TeamHistoricalPerformance[]>(query, [
    currentSeasonId,
    teamId,
    currentSeasonId,
    MIN_MATCHING_PLAYERS
  ]);

  return results;
};
