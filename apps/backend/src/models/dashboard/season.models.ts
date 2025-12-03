import {
  type CSRankkerResponse,
  type TeamEligibilityResult
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../../db/mysqlRunQuery";
import { ensureSeasonMaxPlayersForTeam } from "../../services/season.services";

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
 * - Top 3 teams in the same league with their avg4 values (for finalized seasons only)
 * - Whether the player can be added
 *
 * @param seasonId The season ID
 * @param teamId The team ID
 * @param newPlayerSteamId The steam ID of the player to check
 * @param options Additional options including connection and context
 */
export const checkPlayerAdditionEligibility = async (
  seasonId: number,
  teamId: number,
  newPlayerSteamId: string,
  options?: {
    connection?: PoolConnection;
    context?: "finalized" | "registration";
  }
): Promise<TeamEligibilityResult> => {
  const context = options?.context || "finalized";

  // For registration context, skip league checks
  if (context === "registration") {
    // Get stabilized kana_elo from CSRankker service
    const stabilizedKanaElo = await getStabilizedKanaElo(newPlayerSteamId);

    // Get CSRankker components for display
    const csrankkerComponents =
      await fetchCSRankkerComponents(newPlayerSteamId);

    // Get the selected team's info from registrations
    const teamQuery = `
      SELECT t.id AS team_id, t.name AS team_name
      FROM Teams t
      WHERE t.id = ?
    `;

    const [teamResult] = await runQuery<
      Array<{ team_id: number; team_name: string }>
    >(teamQuery, [teamId], options?.connection);

    if (!teamResult) {
      throw new Error(`Team ${teamId} not found`);
    }

    // For registrations, we don't have league comparisons
    return {
      selectedTeam: {
        team_id: teamResult.team_id,
        team_name: teamResult.team_name,
        current_top3_avg: 0,
        current_top4_avg: 0,
        new_player_kana_elo: stabilizedKanaElo,
        new_avg_with_player: 0,
        csrankker_components: csrankkerComponents
      },
      topTeamsInLeague: [],
      canAddPlayer: true, // Always true for registrations
      league_name: "Registration"
    };
  }

  // Finalized season context - original logic
  // First, get the league for the selected team
  const leagueQuery = `
      SELECT slt.league_id
      FROM SeasonLeagueTeams slt
      WHERE slt.team_id = ? AND slt.season_id = ?
      LIMIT 1
    `;

  const leagueResults = await runQuery<Array<{ league_id: number | null }>>(
    leagueQuery,
    [teamId, seasonId],
    options?.connection
  );

  if (!leagueResults || leagueResults.length === 0) {
    throw new Error(`Team ${teamId} not found in season ${seasonId}`);
  }

  const leagueId = leagueResults[0].league_id;

  await ensureSeasonMaxPlayersForTeam(seasonId, teamId);
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
        JOIN SeasonTeamPlayers strp ON strp.team_id = t.id AND strp.season_id = ? AND strp.role = 'primary'
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
        JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = ?
        JOIN SeasonTeamPlayers strp ON strp.team_id = t.id AND strp.season_id = slt.season_id AND strp.role = 'primary'
        JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = slt.season_id
        WHERE slt.league_id = ? AND slt.team_id != ?
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
  >(topTeamsQuery, [seasonId, leagueId, teamId], options?.connection);

  // Check if the selected team's new average would be lower than the top team's avg4
  const topTeamAvg4 = topTeams[0]?.avg4 || 0;
  const canAddPlayer = newAvgWithPlayer <= topTeamAvg4;

  // Get league name for display purposes only
  const leagueNameQuery = `
      SELECT l.name AS league_name
      FROM Leagues l
      WHERE l.id = ?
  `;

  const [leagueNameResult] = await runQuery<Array<{ league_name: string }>>(
    leagueNameQuery,
    [leagueId],
    options?.connection
  );

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
    league_name: leagueNameResult.league_name
  };
};
