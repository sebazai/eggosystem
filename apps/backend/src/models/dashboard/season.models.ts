import {
  type CSRankkerResponse,
  type TeamEligibilityResult
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../../db/mysqlRunQuery";

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
