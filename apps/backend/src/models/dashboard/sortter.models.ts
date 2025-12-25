import { runQuery } from "../../db/mysqlRunQuery";
import { redisClient } from "../../utils/redisClient";
import {
  type TeamSortterValues,
  type TeamSortterValuesRaw,
  type PlayerSortterValues
} from "@eggosystem/types";
import {
  buildComparisonAvgSQL,
  buildTopPlayersFilter,
  SQL_COLUMNS,
  TOP_N_FOR_DISPLAY
} from "../../utils/team-calculations";

/**
 * Gets team values for sortter functionality:
 * - Team name
 * - Sum of kanaelo for top N players in the team (configurable via TOP_N_FOR_DISPLAY)
 * - Average of kanaelo for comparison (configurable via TOP_N_FOR_COMPARISON)
 * - Team league
 * - Kanaelo values for top N players as an array
 *
 * @param seasonId The season ID to filter teams by
 * @returns Array of team values
 */
export const getTeamValuesForSortter = async (
  seasonId: number
): Promise<TeamSortterValues[]> => {
  const query = `
    WITH TeamPlayersKanaElo AS (
      SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.team_logo,
        COALESCE(l.name, 'Unassigned') AS league_name,
        spr.steam_id,
        spr.kana_elo,
        spr.offered_elo,
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY spr.kana_elo DESC) AS player_rank
      FROM Teams t
      JOIN SeasonTeamRegistrationPlayers strp ON strp.team_id = t.id
      JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = strp.season_id
      JOIN SeasonTeamRegistrations str ON str.team_id = t.id AND str.season_id = strp.season_id
      LEFT JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = strp.season_id
      LEFT JOIN Leagues l ON l.id = slt.league_id
      WHERE strp.season_id = ?
        AND str.approved = 1
      ORDER BY t.id, spr.kana_elo DESC
    ),
    TeamTopPlayers AS (
      SELECT
        team_id,
        team_name,
        team_logo,
        league_name,
        player_rank,
        kana_elo,
        offered_elo
      FROM TeamPlayersKanaElo
      WHERE ${buildTopPlayersFilter()}
    ),
    TeamValues AS (
      SELECT
        team_id,
        team_name,
        team_logo,
        league_name,
        SUM(kana_elo) AS top${TOP_N_FOR_DISPLAY}_sum,
        ${buildComparisonAvgSQL()} AS ${SQL_COLUMNS.COMPARISON_AVG},
        ${buildComparisonAvgSQL("offered_elo")} AS ${SQL_COLUMNS.ORIGINAL_COMPARISON_AVG},
        JSON_ARRAYAGG(kana_elo ORDER BY player_rank) AS top${TOP_N_FOR_DISPLAY}_values,
        JSON_ARRAYAGG(offered_elo ORDER BY player_rank) AS top${TOP_N_FOR_DISPLAY}_offered_values
      FROM TeamTopPlayers
      GROUP BY team_id, team_name, team_logo, league_name
    )
    SELECT
      team_id,
      team_name,
      team_logo,
      league_name,
      top${TOP_N_FOR_DISPLAY}_sum,
      ${SQL_COLUMNS.COMPARISON_AVG},
      ${SQL_COLUMNS.ORIGINAL_COMPARISON_AVG},
      top${TOP_N_FOR_DISPLAY}_values,
      top${TOP_N_FOR_DISPLAY}_offered_values
    FROM TeamValues
    ORDER BY ${SQL_COLUMNS.COMPARISON_AVG} DESC
  `;

  const rawResults = await runQuery<TeamSortterValuesRaw[]>(query, [seasonId]);

  // Convert results to the expected format
  const results = rawResults.map((team) => {
    // Parse the JSON string and ensure all values are numbers
    const parsedValues = JSON.parse(team.top5_values);
    const parsedOfferedValues = team.top5_offered_values
      ? JSON.parse(team.top5_offered_values)
      : Array(parsedValues.length).fill(null);

    // Map each value to ensure they're all numbers
    const top5_values = Array.isArray(parsedValues)
      ? parsedValues.map((val) => Number(val))
      : [];

    const top5_offered_values = Array.isArray(parsedOfferedValues)
      ? parsedOfferedValues.map((val) => (val !== null ? Number(val) : null))
      : [];

    return {
      ...team,
      top5_values,
      top5_offered_values,
      // Ensure orig4 is a number (or null if not available)
      orig4: team.orig4 !== null ? Number(team.orig4) : null,
      // Initialize is_flagged to false, will be updated later if needed
      is_flagged: false as boolean
    };
  }) satisfies TeamSortterValues[];

  // Check for team flags in Redis
  try {
    // Get all team flag keys for the current season
    const flagKeys = await redisClient.keys(`team-flag:s${seasonId}:*`);

    // Handle case where Redis might return undefined/null (e.g., in tests)
    if (!flagKeys || !Array.isArray(flagKeys)) {
      // Redis unavailable or returned invalid data, skip flag checking but return results
      return results;
    }

    if (flagKeys.length > 0) {
      // Create a set of flagged team IDs for quick lookup
      const flaggedTeamIds = new Set<number>();

      // Extract team IDs from flag keys (format: team-flag:s{season_id}:l{league_id}:{team_id})
      for (const key of flagKeys) {
        const parts = key.split(":");
        if (parts.length >= 4) {
          const teamId = parseInt(parts[3], 10);
          if (!isNaN(teamId)) {
            flaggedTeamIds.add(teamId);
          }
        }
      }

      console.warn(`Flagged team IDs:`, Array.from(flaggedTeamIds));
      console.warn(`Total teams in results: ${results.length}`);

      // Mark flagged teams
      let flaggedCount = 0;
      for (const team of results) {
        const isFlagged = flaggedTeamIds.has(team.team_id);
        team.is_flagged = isFlagged;
        if (isFlagged) {
          flaggedCount++;
          console.warn(`Team ${team.team_id} (${team.team_name}) is flagged`);
        }
      }

      console.warn(
        `Marked ${flaggedCount} teams as flagged out of ${results.length} total teams`
      );
    }
  } catch (error) {
    console.error("Error checking team flags:", error);
  }

  return results;
};

/**
 * Gets player values for a specific team and season for sorter functionality:
 * - Player name
 * - Steam ID
 * - CS2 rank
 * - Faceit level
 * - Faceit ELO
 * - CS hours
 * - Kana rating (average from all games player played)
 * - FKD (Faceit K/D ratio)
 *
 * @param seasonId The season ID to filter by
 * @param teamId The team ID to filter by
 * @param isHistorical If true, don't filter by approved=true (for historical data)
 * @returns Array of player values
 */
export const getTeamPlayerValuesForSortter = async (
  seasonId: number,
  teamId: number
): Promise<PlayerSortterValues[]> => {
  const query = `
    SELECT
      sp.nickname AS name,
      sp.steam_id AS steamid,
      spr.cs2_rank,
      spr.faceit_level,
      spr.faceit_elo,
      spr.cs_hours AS hours,
      ROUND(AVG(ps.kana_rating), 6) AS kanarating,
      spr.faceit_kd AS fkd,
      spr.kana_elo,
      spr.offered_elo,
      calculus
    FROM Teams t
    JOIN SeasonTeamRegistrationPlayers strp ON strp.team_id = t.id
    JOIN SeasonTeamRegistrations str ON str.team_id = t.id AND str.season_id = strp.season_id
    JOIN SteamPlayers sp ON sp.steam_id = strp.steam_id
    JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = strp.season_id
    LEFT JOIN PlayerStats ps ON ps.steam_id = sp.steam_id
    LEFT JOIN MatchGames mg ON mg.id = ps.match_game_id
    LEFT JOIN Matches m ON m.id = mg.match_id AND m.season_id = strp.season_id
    WHERE strp.season_id = ?
      AND strp.team_id = ?
      AND str.approved = 1
    GROUP BY
      sp.nickname,
      sp.steam_id,
      spr.cs2_rank,
      spr.faceit_level,
      spr.faceit_elo,
      spr.cs_hours,
      spr.faceit_kd,
      spr.kana_elo
    ORDER BY
      spr.kana_elo DESC
  `;

  const results = await runQuery<PlayerSortterValues[]>(query, [
    seasonId,
    teamId
  ]);

  return results;
};

/**
 * Gets LIVE player values for a specific team and season:
 * Uses SeasonTeamPlayers (live data) instead of SeasonTeamRegistrationPlayers
 * This shows players who are currently registered to the team, including those added after sortter finalization
 *
 * Returns:
 * - Player name
 * - Steam ID
 * - CS2 rank
 * - Faceit level
 * - Faceit ELO
 * - CS hours
 * - Kana rating (average from all games player played)
 * - FKD (Faceit K/D ratio)
 * - Role (primary/substitute)
 * - Captain/Co-captain status
 *
 * @param seasonId The season ID to filter by
 * @param teamId The team ID to filter by
 * @returns Array of player values with role information
 */
export const getTeamPlayerValuesLive = async (
  seasonId: number,
  teamId: number
): Promise<
  (PlayerSortterValues & {
    role: string;
    is_captain: boolean;
    is_co_captain: boolean;
    match_id: number | null;
    match_info: string | null;
  })[]
> => {
  const query = `
    SELECT
      sp.nickname AS name,
      sp.steam_id AS steamid,
      spr.cs2_rank,
      spr.faceit_level,
      spr.faceit_elo,
      spr.cs_hours AS hours,
      ROUND(AVG(ps.kana_rating), 6) AS kanarating,
      spr.faceit_kd AS fkd,
      spr.kana_elo,
      spr.offered_elo,
      spr.calculus,
      stp.role,
      stp.is_captain,
      stp.is_co_captain,
      stp.match_id,
      CASE 
        WHEN stp.match_id IS NOT NULL THEN 
          CONCAT(
            'Match #', stp.match_id,
            ' (', DATE_FORMAT(m.match_date, '%Y-%m-%d'), ')',
            CASE 
              WHEN match_teams IS NOT NULL THEN CONCAT(' - ', match_teams)
              ELSE ''
            END
          )
        ELSE NULL
      END AS match_info
    FROM Teams t
    JOIN SeasonTeamPlayers stp ON stp.team_id = t.id
    JOIN SteamPlayers sp ON sp.steam_id = stp.steam_id
    JOIN SeasonPlayerRanks spr ON spr.steam_id = stp.steam_id AND spr.season_id = stp.season_id
    LEFT JOIN PlayerStats ps ON ps.steam_id = sp.steam_id
    LEFT JOIN MatchGames mg ON mg.id = ps.match_game_id
    LEFT JOIN Matches m_stats ON m_stats.id = mg.match_id AND m_stats.season_id = stp.season_id
    LEFT JOIN Matches m ON m.id = stp.match_id
    LEFT JOIN (
      SELECT 
        mt.match_id,
        GROUP_CONCAT(t_match.name ORDER BY t_match.name SEPARATOR ' vs ') as match_teams
      FROM MatchTeams mt
      JOIN Teams t_match ON mt.team_id = t_match.id
      GROUP BY mt.match_id
    ) teams_in_match ON teams_in_match.match_id = stp.match_id
    WHERE stp.season_id = ?
      AND stp.team_id = ?
      AND stp.discarded_at IS NULL
    GROUP BY
      sp.nickname,
      sp.steam_id,
      spr.cs2_rank,
      spr.faceit_level,
      spr.faceit_elo,
      spr.cs_hours,
      spr.faceit_kd,
      spr.kana_elo,
      spr.calculus,
      stp.role,
      stp.is_captain,
      stp.is_co_captain,
      stp.match_id,
      m.match_date,
      match_teams
    ORDER BY
      CASE stp.role WHEN 'primary' THEN 0 ELSE 1 END,
      spr.kana_elo DESC
  `;

  const results = await runQuery<
    (PlayerSortterValues & {
      role: string;
      is_captain: boolean;
      is_co_captain: boolean;
      match_id: number | null;
      match_info: string | null;
    })[]
  >(query, [seasonId, teamId]);

  return results;
};
