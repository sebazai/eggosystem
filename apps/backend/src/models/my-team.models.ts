import type { MyTeamDetails, MyTeamUpcomingMatch } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import JSONBig from "json-bigint";

/**
 * Gets all teams that a user (by steam_id) is a member of in the latest season
 * Includes team details, league information, and all team members with their roles
 */
export const getMyTeams = async (
  steam_id: string
): Promise<MyTeamDetails[]> => {
  const query = `
    WITH LatestSeason AS (
      SELECT MAX(s.id) as latest_season_id
      FROM Seasons s
      JOIN SeasonTeamPlayers stp ON stp.season_id = s.id
      WHERE stp.steam_id = ?
    )
    SELECT 
      t.id as team_id,
      t.name as team_name,
      t.team_logo,
      s.id as season_id,
      s.name as season_name,
      l.id as league_id,
      l.name as league_name,
      slt.external_team_id,
      s.platform,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'steam_id', stp_all.steam_id,
          'nickname', sp.nickname,
          'is_captain', stp_all.is_captain,
          'is_co_captain', stp_all.is_co_captain,
          'role', stp_all.role
        )
      ) as players
    FROM SeasonTeamPlayers stp
    JOIN LatestSeason ls ON stp.season_id = ls.latest_season_id
    JOIN Teams t ON stp.team_id = t.id
    JOIN Seasons s ON stp.season_id = s.id
    JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = s.id
    JOIN Leagues l ON slt.league_id = l.id
    JOIN SeasonTeamPlayers stp_all ON stp_all.team_id = t.id AND stp_all.season_id = s.id
    JOIN SteamPlayers sp ON stp_all.steam_id = sp.steam_id
    WHERE stp.steam_id = ?
    GROUP BY t.id, t.name, t.team_logo, s.id, s.name, l.id, l.name, slt.external_team_id, s.platform
    ORDER BY l.id ASC
  `;

  const results = await runQuery<
    Array<
      Omit<MyTeamDetails, "players"> & {
        players: string;
      }
    >
  >(query, [steam_id, steam_id]);

  // Parse JSON players array using JSONBig to preserve large integers (Steam IDs)
  // Convert boolean strings back to booleans (MySQL returns booleans as 0/1, JSONBig converts to "0"/"1")
  return results.map((row) => ({
    ...row,
    players: row.players
      ? JSONBig({ storeAsString: true })
          .parse(row.players)
          .map(
            (player: {
              steam_id: string;
              nickname: string;
              is_captain: string | boolean | number;
              is_co_captain: string | boolean | number;
              role: "primary" | "substitute";
            }) =>
              ({
                steam_id: player.steam_id,
                nickname: player.nickname,
                is_captain:
                  player.is_captain === true ||
                  player.is_captain === "1" ||
                  player.is_captain === 1,
                is_co_captain:
                  player.is_co_captain === true ||
                  player.is_co_captain === "1" ||
                  player.is_co_captain === 1,
                role: player.role
              }) satisfies MyTeamDetails["players"][0]
          )
      : []
  }));
};

/**
 * Gets upcoming matches for all teams that a user (by steam_id) is a member of
 * Returns matches that are scheduled or in progress, ordered by date/time
 */
export const getMyTeamsUpcomingMatches = async (
  steam_id: string
): Promise<MyTeamUpcomingMatch[]> => {
  const query = `
    SELECT 
      m.id as match_id,
      mt.team_id,
      t.name as team_name,
      mt_opp.team_id as opponent_team_id,
      t_opp.name as opponent_team_name,
      m.match_date,
      m.start_time,
      m.season_id,
      s.name as season_name,
      m.league_id,
      l.name as league_name,
      m.best_of,
      m.external_match_room_id,
      m.status,
      s.platform
    FROM SeasonTeamPlayers stp
    JOIN MatchTeams mt ON mt.team_id = stp.team_id AND mt.season_id = stp.season_id
    JOIN Matches m ON m.id = mt.match_id
    JOIN Teams t ON mt.team_id = t.id
    JOIN Seasons s ON m.season_id = s.id
    JOIN Leagues l ON m.league_id = l.id
    -- Get opponent team
    JOIN MatchTeams mt_opp ON mt_opp.match_id = m.id AND mt_opp.team_id != mt.team_id
    JOIN Teams t_opp ON mt_opp.team_id = t_opp.id
    WHERE stp.steam_id = ?
      AND m.status IN ('SCHEDULED', 'CHECK_IN', 'VOTING', 'CONFIGURING', 'READY', 'ONGOING')
      AND (
        m.match_date > CURDATE()
        OR (m.match_date = CURDATE() AND m.start_time >= CURTIME())
        OR m.status IN ('ONGOING', 'READY', 'CONFIGURING', 'VOTING', 'CHECK_IN')
      )
    ORDER BY m.match_date ASC, m.start_time ASC
    LIMIT 50
  `;

  return runQuery<MyTeamUpcomingMatch[]>(query, [steam_id]);
};

/**
 * Gets all FaceIT championship links for a specific season and league
 * Returns multiple championships if they exist (e.g., Regular, Playoffs, Groups)
 */
export const getMyTeamChampionships = async (
  season_id: number,
  league_id: number
) => {
  const query = `
    SELECT 
      slei.id,
      slei.external_id,
      slei.external_league_name,
      slei.type,
      st.name as stage_name
    FROM SeasonLeagueExternalIds slei
    JOIN Stages st ON slei.stage_id = st.id
    WHERE slei.season_id = ? AND slei.league_id = ?
    ORDER BY slei.stage_id ASC, slei.id ASC
  `;

  return runQuery<
    Array<{
      id: number;
      external_id: string;
      external_league_name: string;
      type: string;
      stage_name: string;
    }>
  >(query, [season_id, league_id]);
};
