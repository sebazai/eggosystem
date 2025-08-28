import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { redisClient } from "../utils/redisClient";
import {
  type TeamSortterValues,
  type TeamSortterValuesRaw,
  type PlayerSortterValues,
  type TeamEligibilityResult
} from "@eggosystem/types";

/**
 * Gets team values for sorter functionality:
 * - Team name
 * - Sum of kanaelo for top 5 players in the team
 * - Average of kanaelo for top 4 players in the team
 * - Team league
 * - Kanaelo values for top 5 players as an array
 *
 * @param seasonId The season ID to filter teams by
 * @param
 * @returns Array of team values
 */
export const getTeamValuesForSorter = async (
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
      JOIN SeasonTeamPlayers strp ON strp.team_id = t.id
      JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = strp.season_id
      LEFT JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = strp.season_id
      LEFT JOIN Leagues l ON l.id = slt.league_id
      WHERE strp.season_id = ?
      ORDER BY t.id, spr.kana_elo DESC
    ),
    TeamTop5Players AS (
      SELECT
        team_id,
        team_name,
        team_logo,
        league_name,
        player_rank,
        kana_elo,
        offered_elo
      FROM TeamPlayersKanaElo
      WHERE player_rank <= 5
    ),
    TeamValues AS (
      SELECT
        team_id,
        team_name,
        team_logo,
        league_name,
        SUM(kana_elo) AS top5_sum,
        ROUND(AVG(CASE WHEN player_rank <= 4 THEN kana_elo ELSE NULL END), 3) AS avg4,
        ROUND(AVG(CASE WHEN player_rank <= 4 THEN offered_elo ELSE NULL END), 3) AS orig4,
        JSON_ARRAYAGG(kana_elo ORDER BY player_rank) AS top5_values,
        JSON_ARRAYAGG(offered_elo ORDER BY player_rank) AS top5_offered_values
      FROM TeamTop5Players
      GROUP BY team_id, team_name, team_logo, league_name
    )
    SELECT
      team_id,
      team_name,
      team_logo,
      league_name,
      top5_sum,
      avg4,
      orig4,
      top5_values,
      top5_offered_values
    FROM TeamValues
    ORDER BY avg4 DESC
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
    console.warn(
      `Found ${flagKeys.length} team flag keys for season ${seasonId}`
    );

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
    LEFT JOIN MatchGames mg ON mg.id = ps.game_id
    LEFT JOIN Matches m ON m.id = mg.match_id AND m.season_id = strp.season_id
    WHERE strp.season_id = ?
      AND strp.team_id = ?
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
 * Gets teams for a specific season for the add player functionality
 * Returns teams with their league information
 *
 * @param seasonId The season ID to filter by
 * @param isHistorical If true, don't filter by approved=true (for historical data)
 */
export const getTeamsForAddPlayerToTeamSeason = async (
  seasonId: number
): Promise<
  Array<{ team_id: number; team_name: string; league_name: string }>
> => {
  const query = `
    SELECT DISTINCT
      t.id AS team_id,
      t.name AS team_name,
      COALESCE(l.name, 'Unassigned') AS league_name
    FROM Teams t
    JOIN SeasonTeamPlayers strp ON strp.team_id = t.id
    JOIN SeasonLeagueTeams str ON str.team_id = t.id AND str.season_id = strp.season_id
    LEFT JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = strp.season_id
    LEFT JOIN Leagues l ON l.id = slt.league_id
    WHERE strp.season_id = ?
    ORDER BY t.name ASC
  `;

  return runQuery<
    Array<{ team_id: number; team_name: string; league_name: string }>
  >(query, [seasonId]);
};

/**
 * Interface for CSRankker API response
 */
interface CSRankkerResponse {
  status: string;
  result: {
    steamId: string;
    seasonId: number;
    originalKanaelo: number;
    stabilizedKanaelo: number;
    stabilizationInfo: {
      confidence: number;
      adjustmentFactor: number;
      method: string;
    };
    components: {
      trueLevel: number;
      mm: number;
      hour: number;
      kana: number;
    };
    calculus: string;
    timestamp: string;
  };
}

/**
 * Gets stabilized kana_elo from CSRankker service
 */
const getStabilizedKanaElo = async (steamId: string): Promise<number> => {
  const csRankkerUrl =
    process.env.CSRANKKER_BACKEND_API ||
    "https://csrankker.kanaliiga.fi/api/v1/kanaelo";
  const url = `${csRankkerUrl}/${steamId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `CSRankker API returned ${response.status}: ${response.statusText}`
      );
    }

    const data: CSRankkerResponse = await response.json();

    if (data.status !== "success") {
      throw new Error("CSRankker API returned unsuccessful status");
    }

    return data.result.stabilizedKanaelo;
  } catch (error) {
    throw new Error(
      `Failed to fetch stabilized kana_elo from CSRankker: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// Helper function to fetch CSRankker components with timeout
async function fetchCSRankkerComponents(
  steamId: string,
  timeoutMs: number = 5000
): Promise<
  { trueLevel: number; mm: number; hour: number; kana: number } | undefined
> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const csRankkerUrl =
      process.env.CSRANKKER_BACKEND_API ||
      "https://csrankker.kanaliiga.fi/api/v1/kanaelo";

    const response = await fetch(`${csRankkerUrl}/${steamId}`, {
      signal: controller.signal
    });

    if (response.ok) {
      const data: CSRankkerResponse = await response.json();
      if (data.status === "success") {
        return data.result.components;
      }
    }
  } catch (error) {
    // Silently fail for components - we still have the kana_elo value
    // Only log in non-test environments to avoid test pollution
    if (process.env.NODE_ENV !== "test" && !controller.signal.aborted) {
      console.warn("Failed to fetch CSRankker components:", error);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  return undefined;
}

/**
 * Checks if a player can be added to a team based on kana_elo balance
 * Returns analysis including:
 * - Selected team's current top 3 players + new player average
 * - Top 3 teams in the same league with their avg4 values
 * - Whether the player can be added
 *
 * @param seasonId The season ID
 * @param teamId The team ID
 * @param newPlayerSteamId The steam ID of the player to check
 * @param isHistorical If true, don't filter by approved=true (for historical data)
 */
export const checkPlayerAdditionEligibility = async (
  seasonId: number,
  teamId: number,
  newPlayerSteamId: string,
  options?: { connection?: PoolConnection }
): Promise<TeamEligibilityResult> => {
  // First, get the league for the selected team
  const leagueQuery = `
    SELECT COALESCE(l.name, 'Unassigned') AS league_name
    FROM Teams t
    JOIN SeasonTeamPlayers strp ON strp.team_id = t.id
    JOIN SeasonLeagueTeams str ON str.team_id = t.id AND str.season_id = strp.season_id
    LEFT JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = strp.season_id
    LEFT JOIN Leagues l ON l.id = slt.league_id
    WHERE strp.season_id = ? AND strp.team_id = ?
    LIMIT 1
  `;

  const leagueResults = await runQuery<Array<{ league_name: string }>>(
    leagueQuery,
    [seasonId, teamId],
    options?.connection
  );

  if (!leagueResults || leagueResults.length === 0) {
    throw new Error(`Team ${teamId} not found in season ${seasonId}`);
  }

  const leagueName = leagueResults[0].league_name;

  // Get stabilized kana_elo from CSRankker service
  const stabilizedKanaElo = await getStabilizedKanaElo(newPlayerSteamId);

  // Get CSRankker components for display
  const csrankkerComponents = await fetchCSRankkerComponents(newPlayerSteamId);

  // Get the selected team's current top players + new player analysis
  const selectedTeamQuery = `
    WITH TeamTopPlayers AS (
      SELECT
        t.id AS team_id,
        t.name AS team_name,
        spr.kana_elo,
        ROW_NUMBER() OVER (ORDER BY spr.kana_elo DESC) AS player_rank
      FROM Teams t
      JOIN SeasonTeamPlayers strp ON strp.team_id = t.id AND strp.season_id = ?
      JOIN SeasonLeagueTeams str ON str.team_id = t.id AND str.season_id = strp.season_id
      JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = ?
      WHERE t.id = ?
        AND spr.kana_elo IS NOT NULL
    )
    SELECT
      ttp.team_id,
      ttp.team_name,
      ROUND(AVG(CASE WHEN ttp.player_rank <= 3 THEN ttp.kana_elo ELSE NULL END), 3) AS current_top3_avg,
      ROUND(AVG(CASE WHEN ttp.player_rank <= 4 THEN ttp.kana_elo ELSE NULL END), 3) AS current_top4_avg
    FROM TeamTopPlayers ttp
    GROUP BY ttp.team_id, ttp.team_name
  `;

  const [selectedTeamResult] = await runQuery<
    Array<{
      team_id: number;
      team_name: string;
      current_top3_avg: number;
      current_top4_avg: number;
    }>
  >(selectedTeamQuery, [seasonId, seasonId, teamId], options?.connection);

  if (!selectedTeamResult) {
    throw new Error(
      `Could not analyze team ${teamId} - team may not have enough players in season ${seasonId}`
    );
  }

  // Calculate new average with the stabilized kana_elo
  const newAvgWithPlayer =
    Math.round(
      ((selectedTeamResult.current_top3_avg * 3 + stabilizedKanaElo) / 4) * 1000
    ) / 1000;

  // Get top 3 teams in the same league with their avg4 values
  const topTeamsQuery = `
    WITH TeamPlayersKanaElo AS (
      SELECT
        t.id AS team_id,
        t.name AS team_name,
        spr.kana_elo,
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY spr.kana_elo DESC) AS player_rank
      FROM Teams t
      JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
      JOIN SeasonTeamPlayers strp ON strp.team_id = t.id AND strp.season_id = slt.season_id
      JOIN SeasonLeagueTeams str ON str.team_id = t.id AND str.season_id = strp.season_id
      JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = slt.season_id
      JOIN Leagues l ON l.id = slt.league_id
      WHERE slt.season_id = ? AND l.name = ?
        AND spr.kana_elo IS NOT NULL
      ORDER BY t.id, spr.kana_elo DESC
    ),
    TeamAvg4 AS (
      SELECT
        team_id,
        team_name,
        ROUND(AVG(CASE WHEN player_rank <= 4 THEN kana_elo ELSE NULL END), 3) AS avg4
      FROM TeamPlayersKanaElo
      GROUP BY team_id, team_name
    )
    SELECT
      team_id,
      team_name,
      avg4,
      ROW_NUMBER() OVER (ORDER BY avg4 DESC) AS rank
    FROM TeamAvg4
    WHERE avg4 IS NOT NULL
    ORDER BY avg4 DESC
    LIMIT 3
  `;

  const topTeams = await runQuery<
    Array<{
      team_id: number;
      team_name: string;
      avg4: number;
      rank: number;
    }>
  >(topTeamsQuery, [seasonId, leagueName], options?.connection);

  // Check if the selected team's new average would be lower than the top team's avg4
  const topTeamAvg4 = topTeams[0]?.avg4 || 0;
  const canAddPlayer = newAvgWithPlayer <= topTeamAvg4;

  return {
    selectedTeam: {
      team_id: selectedTeamResult.team_id,
      team_name: selectedTeamResult.team_name,
      current_top3_avg: selectedTeamResult.current_top3_avg,
      current_top4_avg: selectedTeamResult.current_top4_avg,
      new_player_kana_elo: stabilizedKanaElo,
      new_avg_with_player: newAvgWithPlayer,
      csrankker_components: csrankkerComponents
    },
    topTeamsInLeague: topTeams,
    canAddPlayer,
    league_name: leagueName
  };
};
