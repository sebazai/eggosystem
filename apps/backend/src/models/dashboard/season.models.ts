import { type TeamEligibilityResult } from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../../db/mysqlRunQuery";
import { ensureSeasonMaxPlayersForTeam } from "../../services/season.services";
import {
  buildCurrentAvgSQL,
  buildComparisonAvgSQL,
  calculateNewTeamAverage,
  canAddPlayerToTeam,
  SQL_COLUMNS
} from "../../utils/team-calculations";
import { calculateKanaElo } from "../../services/csrankker.services";

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
 * @param options.connection Optional database connection for transactions
 * @param options.excludeSteamId Optional steam ID to exclude from calculations (for substitution scenarios)
 * @param options Additional options including connection and context
 */
export const checkPlayerAdditionEligibility = async (
  seasonId: number,
  teamId: number,
  newPlayerSteamId: string,
  options?: {
    connection?: PoolConnection;
    excludeSteamId?: string;
    context?: "finalized" | "registration";
  }
): Promise<TeamEligibilityResult> => {
  const context = options?.context || "finalized";

  // For registration context, skip league checks
  if (context === "registration") {
    // Get stabilized kana_elo from CSRankker service
    const kanaElo = await calculateKanaElo(newPlayerSteamId, seasonId);

    if (!kanaElo) {
      throw new Error("Failed to calculate kana_elo");
    }

    const csrankkerComponents = kanaElo.result.components;
    const csRankkerCalculusString = kanaElo.result.calculus;
    const originalKanaelo = kanaElo.result.originalKanaelo;
    const stabilizedKanaElo = kanaElo.result.stabilizedKanaelo;

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
        current_top4_avg: 0,
        current_top5_avg: 0,
        new_player_kana_elo: stabilizedKanaElo,
        new_avg_with_player: 0,
        csrankker_components: csrankkerComponents,
        csrankker_calculus: csRankkerCalculusString,
        csrankker_original_kanaelo: originalKanaelo
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
  const kanaElo = await calculateKanaElo(newPlayerSteamId, seasonId);

  if (!kanaElo) {
    throw new Error("Failed to calculate kana_elo");
  }

  const csrankkerComponents = kanaElo.result.components;
  const csRankkerCalculusString = kanaElo.result.calculus;
  const originalKanaelo = kanaElo.result.originalKanaelo;
  const stabilizedKanaElo = kanaElo.result.stabilizedKanaelo;

  // Get the selected team's current top players + new player analysis
  // If excludeSteamId is provided, we exclude that player from calculations (for substitution scenarios)
  const excludeClause = options?.excludeSteamId ? "AND strp.steam_id != ?" : "";
  const queryParams: (number | string)[] = options?.excludeSteamId
    ? [seasonId, seasonId, teamId, options.excludeSteamId]
    : [seasonId, seasonId, teamId];

  const selectedTeamQuery = `
      WITH FilteredPlayers AS (
        SELECT
          t.id AS team_id,
          t.name AS team_name,
          spr.kana_elo
        FROM Teams t
        JOIN SeasonTeamPlayers strp ON strp.team_id = t.id AND strp.season_id = ? AND strp.role = 'primary' AND strp.discarded_at IS NULL
        JOIN SeasonLeagueTeams str ON str.team_id = t.id AND str.season_id = strp.season_id
        JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = ?
        WHERE t.id = ?
          AND spr.kana_elo IS NOT NULL
          ${excludeClause}
      ),
      TeamTopPlayers AS (
        SELECT
          team_id,
          team_name,
          kana_elo,
          ROW_NUMBER() OVER (ORDER BY kana_elo DESC) AS player_rank
        FROM FilteredPlayers
      )
      SELECT
        ttp.team_id,
        ttp.team_name,
        ${buildCurrentAvgSQL()} AS ${SQL_COLUMNS.CURRENT_TOP_AVG},
        ${buildComparisonAvgSQL("ttp.kana_elo")} AS ${SQL_COLUMNS.CURRENT_COMPARISON_AVG}
      FROM TeamTopPlayers ttp
      GROUP BY ttp.team_id, ttp.team_name
    `;

  const [selectedTeamResult] = await runQuery<
    Array<{
      team_id: number;
      team_name: string;
      [key: string]: number | string; // Dynamic column names based on constants
    }>
  >(selectedTeamQuery, queryParams, options?.connection);

  if (!selectedTeamResult) {
    throw new Error(
      `Could not analyze team ${teamId} - team may not have enough players in season ${seasonId}`
    );
  }

  // Extract averages using dynamic column names
  const currentTopAvg = selectedTeamResult[
    SQL_COLUMNS.CURRENT_TOP_AVG
  ] as number;
  const currentComparisonAvg = selectedTeamResult[
    SQL_COLUMNS.CURRENT_COMPARISON_AVG
  ] as number;

  // Calculate new average with the stabilized kana_elo using shared utility
  const newAvgWithPlayer = calculateNewTeamAverage(
    currentTopAvg,
    stabilizedKanaElo
  );

  // Get top 3 teams in the same league with their comparison averages
  const topTeamsQuery = `
      WITH TeamPlayersKanaElo AS (
        SELECT
          t.id AS team_id,
          t.name AS team_name,
          spr.kana_elo,
          ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY spr.kana_elo DESC) AS player_rank
        FROM Teams t
        JOIN SeasonLeagueTeams slt ON slt.team_id = t.id AND slt.season_id = ?
        JOIN SeasonTeamPlayers strp ON strp.team_id = t.id AND strp.season_id = slt.season_id AND strp.role = 'primary' AND strp.discarded_at IS NULL
        JOIN SeasonPlayerRanks spr ON spr.steam_id = strp.steam_id AND spr.season_id = slt.season_id
        WHERE slt.league_id = ? AND slt.team_id != ?
          AND spr.kana_elo IS NOT NULL
        ORDER BY t.id, spr.kana_elo DESC
      ),
      TeamAvgComparison AS (
        SELECT
          team_id,
          team_name,
          ${buildComparisonAvgSQL()} AS ${SQL_COLUMNS.COMPARISON_AVG}
        FROM TeamPlayersKanaElo
        GROUP BY team_id, team_name
      )
      SELECT
        team_id,
        team_name,
        ${SQL_COLUMNS.COMPARISON_AVG},
        ROW_NUMBER() OVER (ORDER BY ${SQL_COLUMNS.COMPARISON_AVG} DESC) AS rank
      FROM TeamAvgComparison
      WHERE ${SQL_COLUMNS.COMPARISON_AVG} IS NOT NULL
      ORDER BY ${SQL_COLUMNS.COMPARISON_AVG} DESC
      LIMIT 3
    `;

  const topTeams = await runQuery<
    Array<{
      team_id: number;
      team_name: string;
      [key: string]: number | string; // Dynamic column names
      rank: number;
    }>
  >(topTeamsQuery, [seasonId, leagueId, teamId], options?.connection);

  // Check if the selected team's new average would be within acceptable range
  const topTeamAvg = (topTeams[0]?.[SQL_COLUMNS.COMPARISON_AVG] as number) || 0;
  const canAddPlayer = canAddPlayerToTeam(newAvgWithPlayer, topTeamAvg);

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

  // Map results to expected format with dynamic column names based on configuration
  const topTeamsFormatted = topTeams.map((team) => ({
    team_id: team.team_id,
    team_name: team.team_name,
    avg5: team[SQL_COLUMNS.COMPARISON_AVG] as number, // Now avg5 based on TOP_N_FOR_COMPARISON=5
    rank: team.rank
  }));

  return {
    selectedTeam: {
      team_id: selectedTeamResult.team_id,
      team_name: selectedTeamResult.team_name as string,
      current_top4_avg: currentTopAvg, // Now top 4 based on TOP_N_FOR_CURRENT_AVG=4
      current_top5_avg: currentComparisonAvg, // Now top 5 based on TOP_N_FOR_COMPARISON=5
      new_player_kana_elo: stabilizedKanaElo,
      new_avg_with_player: newAvgWithPlayer,
      csrankker_components: csrankkerComponents,
      csrankker_calculus: csRankkerCalculusString,
      csrankker_original_kanaelo: originalKanaelo
    },
    topTeamsInLeague: topTeamsFormatted,
    canAddPlayer,
    league_name: leagueNameResult.league_name
  };
};
